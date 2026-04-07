import { Conversation } from "./Classes/conversation.js";

const messagesList = document.getElementById("messagesList");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatCard = document.querySelector(".chat-main-card");

let conv = null;
let pollTimer = null;
const POLL_INTERVAL_MS = 10000; // 10s

// Parse page-level ids early
const url = new URL(window.location.href);
const sellerQuery = url.searchParams.get("sellerId");
const convQuery = url.searchParams.get("conversationId");
const dataset = chatCard?.dataset || {};
const PAGE_CONVERSATION_ID = dataset.conversationId || convQuery;
const PAGE_SELLER_ID = dataset.sellerId || sellerQuery;

async function checkSession() {
    const res = await fetch("/check-session", { credentials: "include" });
    if (!res.ok) throw new Error("Couldn't verify session");
    return res.json();
}

async function ensureConversation(currentUserId) {
    if (PAGE_CONVERSATION_ID) return Number(PAGE_CONVERSATION_ID);

    const sellerId = PAGE_SELLER_ID;
    if (!sellerId) {
        throw new Error("There's no conversationId or sellerId to start a chat with.");
    }

    const res = await fetch("/conversations/check-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user1: currentUserId, user2: Number(sellerId) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Error creating/retrieving conversation");
    return data.conversationId;
}

function scrollToBottom() {
    if (!messagesList) return;
    messagesList.scrollTop = messagesList.scrollHeight;
}

async function loadMessages() {
    if (!conv) return;
    try {
        await conv.getMessages();
        conv.renderMessages(messagesList);
        scrollToBottom();
        console.log("Messages loaded:", conv.messages.length);
    } catch (err) {
        console.error("Error loading messages:", err.message || err);
    }
}

async function init() {
    try {
        if (!messagesList || !chatForm || !chatInput || !chatCard) {
            console.warn("Chat elements are missing from the page.");
            return;
        }

        const session = await checkSession();
        if (!session.loggedIn) {
            console.log("You are not logged in the browser. Please login and reload the page.");
            return;
        }
        const currentUserId = session.userId;

        if (!PAGE_CONVERSATION_ID && !PAGE_SELLER_ID) {
            console.warn("There's no sellerId or conversationId to start a chat with.");
            return;
        }

        const convId = await ensureConversation(currentUserId);
        conv = new Conversation(convId, currentUserId);

        await loadMessages();

        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;
            try {
                chatInput.disabled = true;
                await conv.sendMessage(text);
                chatInput.value = "";
                await loadMessages();
            } catch (err) {
                console.error("Error sending message:", err);
                alert(err.message || "Error sending message. Please try again.");
            } finally {
                chatInput.disabled = false;
            }
        });

        // start polling with visibility-awareness
        if (pollTimer) clearInterval(pollTimer);
        const startPolling = () => {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(loadMessages, POLL_INTERVAL_MS);
        };

        startPolling();

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                loadMessages(); // immediately refresh when tab becomes active
                startPolling();
            } else {
                if (pollTimer) clearInterval(pollTimer); // stop polling when tab is inactive to save resources
            }
        });

        window.addEventListener("beforeunload", () => {
            if (pollTimer) clearInterval(pollTimer);
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
