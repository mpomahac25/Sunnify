import { Conversation } from "./Classes/conversation.js";

const messagesListEl = document.getElementById("messagesListEl") || document.getElementById("messagesList");
const chatFormEl = document.getElementById("chatFormEl") || document.getElementById("chatForm");
let chatInputEl = document.getElementById("chatInputEl") || document.getElementById("chatInput");
if (!chatInputEl && chatFormEl) chatInputEl = chatFormEl.querySelector("input[type=text], input");
const chatCardEl = document.querySelector(".chat-main-card");

let currentConversation = null;
let pollIntervalId = null;
let currentUserId = null;
const POLL_INTERVAL_MS = 10000; // 10s

// Parse page-level ids early
const pageUrl = new URL(window.location.href);
const sellerIdQuery = pageUrl.searchParams.get("sellerId");
const conversationIdQuery = pageUrl.searchParams.get("conversationId");
const chatCardDataset = chatCardEl?.dataset || {};
const pageConversationId = chatCardDataset.conversationId || conversationIdQuery;
const pageSellerId = chatCardDataset.sellerId || sellerIdQuery;

async function checkSession() {
    const response = await fetch("/check-session", { credentials: "include" });
    if (!response.ok) throw new Error("Couldn't verify session");
    return response.json();
}

async function ensureConversation(currentUserIdParam) {
    if (pageConversationId) return Number(pageConversationId);

    const sellerId = pageSellerId;
    if (!sellerId) {
        // no throw: return null and let caller decide what to do
        return null;
    }

    const response = await fetch("/conversations/check-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user1: currentUserIdParam, user2: Number(sellerId) }),
    });
    const jsonData = await response.json().catch(() => null);
    if (!response.ok) {
        console.error("Error creating/obtaining conversation:", jsonData?.error || response.status);
        return null;
    }
    return jsonData.conversationId;
}

async function createOrGetConversationForSeller(sellerId) {
    if (!currentUserId) throw new Error("Session user missing");
    try {
        const response = await fetch("/conversations/check-or-create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user1: currentUserId, user2: Number(sellerId) }),
        });
        const jsonData = await response.json().catch(() => null);
        if (!response.ok) {
            console.error(
                "createOrGetConversationForSeller failed:",
                jsonData?.error || response.status,
            );
            return null;
        }
        return jsonData.conversationId;
    } catch (err) {
        console.error("Network error:", err);
        return null;
    }
}

function scrollToBottom() {
    if (!messagesListEl) return;
    messagesListEl.scrollTop = messagesListEl.scrollHeight;
}

async function loadMessages() {
    if (!currentConversation) {
        console.warn("No conversation selected - nothing to load.");
        return;
    }
    try {
        await currentConversation.getMessages();
        currentConversation.renderMessages(messagesListEl);
        scrollToBottom();
        console.log("Messages loaded:", currentConversation.messages.length);
    } catch (err) {
        console.error("Error loading messages:", err.message || err);
    }
}

async function switchConversationById(conversationId) {
    if (!conversationId) return;
    currentConversation = new Conversation(conversationId, currentUserId);
    await loadMessages();
}

async function switchConversationBySellerId(sellerId) {
    const conversationId = await createOrGetConversationForSeller(sellerId);
    if (!conversationId) {
        alert("No se pudo crear/obtener la conversación con ese usuario.");
        return;
    }
    await switchConversationById(conversationId);
}

async function init() {
    try {
        if (!messagesListEl || !chatFormEl || !chatInputEl || !chatCardEl) {
            console.warn("Chat elements are missing from the page.");
            return;
        }

        const session = await checkSession();
        if (!session.loggedIn) {
            console.log("You are not logged in the browser. Please login and reload the page.");
            chatInputEl.disabled = true;
            chatFormEl.querySelector("button[type=submit]")?.setAttribute("disabled", "true");
            return;
        }
        currentUserId = session.userId;

        // Attach handlers to left-side conversation buttons so user can pick one
        document.querySelectorAll(".chat-user").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const btnDataset = btn.dataset;
                if (btnDataset.conversationId) {
                    await switchConversationById(Number(btnDataset.conversationId));
                } else if (btnDataset.sellerId) {
                    await switchConversationBySellerId(Number(btnDataset.sellerId));
                } else {
                    console.warn(
                        "This conversation button has no data-conversation-id or data-seller-id.",
                    );
                    alert(
                        "Este elemento no tiene información para cargar la conversación. Abre el chat desde la página del anuncio.",
                    );
                }
            });
        });

        // If page gave us a sellerId / conversationId, try to open it
        let conversationId = await ensureConversation(currentUserId);
        if (!conversationId && pageConversationId) conversationId = Number(pageConversationId);

        if (!conversationId) {
            console.log(
                "No conversation preselected. Click a conversation on the left or open this chat from a post.",
            );
            chatInputEl.disabled = true;
            chatFormEl.querySelector("button[type=submit]")?.setAttribute("disabled", "true");
        } else {
            chatInputEl.disabled = false;
            chatFormEl.querySelector("button[type=submit]")?.removeAttribute("disabled");
            await switchConversationById(conversationId);
        }

        chatFormEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentConversation) {
                alert("Selecciona una conversación antes de enviar un mensaje.");
                return;
            }
            const messageText = chatInputEl.value.trim();
            if (!messageText) return;
            try {
                chatInputEl.disabled = true;
                await currentConversation.sendMessage(messageText);
                chatInputEl.value = "";
                await loadMessages();
            } catch (err) {
                console.error("Error sending message:", err);
                alert(err.message || "Error sending message. Try again.");
            } finally {
                chatInputEl.disabled = false;
            }
        });

        // start polling with visibility-awareness
        if (pollIntervalId) clearInterval(pollIntervalId);
        const startPolling = () => {
            if (pollIntervalId) clearInterval(pollIntervalId);
            pollIntervalId = setInterval(loadMessages, POLL_INTERVAL_MS);
        };

        startPolling();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                loadMessages(); // refresh immediately
                startPolling();
            } else {
                if (pollIntervalId) clearInterval(pollIntervalId);
            }
        });

        window.addEventListener("beforeunload", () => {
            if (pollIntervalId) clearInterval(pollIntervalId);
        });
    } catch (err) {
        console.error("Init chat error:", err);
    }
}

// guard anti-doble init
if (window.__sunnifyChatInit) {
    console.log("Chat ya inicializado");
} else {
    window.__sunnifyChatInit = true;
    init();
}