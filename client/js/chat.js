// client/js/chat.js
// Page-level chat controller for the Sunnify app.
// This file wires the chat UI to the backend conversation/message endpoints.
// The comments below explain each section/behavior in English; the original code is unchanged.

import { Conversation } from "./Classes/conversation.js";

// DOM lookups with several fallback id names to tolerate different page templates.
// `messagesListEl` is the container where messages will be rendered.
// `chatFormEl` is the form used to submit new messages.
// `chatInputEl` is the text input inside the form (found directly or by querying the form).
const messagesListEl = document.getElementById("messagesListEl") || document.getElementById("messagesList");
const chatFormEl = document.getElementById("chatFormEl") || document.getElementById("chatForm");
let chatInputEl = document.getElementById("chatInputEl") || document.getElementById("chatInput");
if (!chatInputEl && chatFormEl) chatInputEl = chatFormEl.querySelector("input[type=text], input");
// `chatCardEl` is a container element that may include dataset attributes (conversationId, sellerId).
const chatCardEl = document.querySelector(".chat-main-card");

// In-memory runtime state:
// - `currentConversation`: Conversation instance currently open in the UI.
// - `pollIntervalId`: id returned by setInterval for polling messages.
// - `currentUserId`: numeric id of the logged-in user (populated after session check).
// - `POLL_INTERVAL_MS`: how often the client polls for new messages (10 seconds).
let currentConversation = null;
let pollIntervalId = null;
let currentUserId = null;
const POLL_INTERVAL_MS = 10000; // 10s

// Parse any page-level ids early so they are available during init:
// - URL query parameters `sellerId` and `conversationId`.
// - dataset attributes on the chat card element as fallback.
// The `pageConversationId` and `pageSellerId` values are used when opening a conversation.
const pageUrl = new URL(window.location.href);
const sellerIdQuery = pageUrl.searchParams.get("sellerId");
const conversationIdQuery = pageUrl.searchParams.get("conversationId");
const chatCardDataset = chatCardEl?.dataset || {};
const pageConversationId = chatCardDataset.conversationId || conversationIdQuery;
const pageSellerId = chatCardDataset.sellerId || sellerIdQuery;

// checkSession(): asks the server whether the browser session contains a logged-in user.
// - Calls `GET /check-session` with credentials so the session cookie is sent.
// - Expects a JSON response; throws on non-OK HTTP status.
async function checkSession() {
    const response = await fetch("/check-session", { credentials: "include" });
    if (!response.ok) throw new Error("Couldn't verify session");
    return response.json();
}

// ensureConversation(currentUserIdParam):
// - If the page already set `pageConversationId`, return it (no network call).
// - Otherwise, if we have a `pageSellerId`, attempt to POST to
//   `/conversations/check-or-create` to find or create a conversation between
//   the current user and the seller.
// - Returns the conversationId on success, or `null` if no sellerId was present or the request failed.
// - Note: this function deliberately does not throw for failures — callers handle `null`.
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

// createOrGetConversationForSeller(sellerId):
// - Convenience wrapper used by UI elements that represent sellers.
// - Requires `currentUserId` to be set (throws if missing) and returns the conversation id or null.
// - Catches network errors and logs them; callers handle `null` results.
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

// scrollToBottom(): scrolls the messages container so the latest messages are visible.
// Safe-guards if the element is not present.
function scrollToBottom() {
    if (!messagesListEl) return;
    messagesListEl.scrollTop = messagesListEl.scrollHeight;
}

// loadMessages(): uses the current Conversation object to fetch messages and render them.
// - If no conversation is selected, logs a warning and returns.
// - Calls `currentConversation.getMessages()` then `renderMessages()` and scrolls to bottom.
// - Errors are caught and logged to avoid throwing during polling.
async function loadMessages() {
    if (!currentConversation) {
        console.warn("No conversation selected, nothing to load.");
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

// switchConversationById(conversationId):
// - Replace the `currentConversation` with a new `Conversation` instance for the given id,
//   then load and render its messages.
async function switchConversationById(conversationId) {
    if (!conversationId) return;
    currentConversation = new Conversation(conversationId, currentUserId);
    await loadMessages();
}

// switchConversationBySellerId(sellerId):
// - Convenience that obtains/creates the conversation for a seller, then switches to it.
// - Alerts the user if no conversation could be created or obtained.
async function switchConversationBySellerId(sellerId) {
    const conversationId = await createOrGetConversationForSeller(sellerId);
    if (!conversationId) {
        alert("Could not create/get the conversation with that user.");
        return;
    }
    await switchConversationById(conversationId);
}

// init(): main initialization sequence executed once on page load.
// Responsibilities:
//  - Verify required DOM elements are present and bail out if not.
//  - Confirm browser session and set `currentUserId`.
//  - Wire click handlers for `.chat-user` elements on the left-side conversation list,
//    allowing selection by `data-conversation-id` or `data-seller-id`.
//  - Attempt to open a preselected conversation (from page dataset or query param).
//  - Wire the message form submit handler to send messages and refresh the UI.
//  - Start polling for new messages and pause/resume based on page visibility.
//  - Clean up polling on unload.
async function init() {
    try {
        if (!messagesListEl || !chatFormEl || !chatInputEl || !chatCardEl) {
            console.warn("Chat elements are missing from the page.");
            return;
        }

        // Confirm session in this browser (important — curl/test sessions are separate)
        const session = await checkSession();
        if (!session.loggedIn) {
            // Not logged in: disable chat input and tell the user. The user must login in the browser.
            console.log("You are not logged in the browser. Please login and reload the page.");
            chatInputEl.disabled = true;
            chatFormEl.querySelector("button[type=submit]")?.setAttribute("disabled", "true");
            return;
        }
        // Save the authenticated user id for message rendering and sending.
        currentUserId = session.userId;

        // Attach click handlers to conversation list items on the left side.
        // Each `.chat-user` element should expose either `data-conversation-id` or `data-seller-id`.
        document.querySelectorAll(".chat-user").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const btnDataset = btn.dataset;
                if (btnDataset.conversationId) {
                    await switchConversationById(Number(btnDataset.conversationId));
                } else if (btnDataset.sellerId) {
                    await switchConversationBySellerId(Number(btnDataset.sellerId));
                } else {
                    // Defensive fallback: warn and inform the user how to open conversation.
                    console.warn(
                        "This conversation button has no data-conversation-id or data-seller-id.",
                    );
                    alert(
                        "This element has no information to load the conversation. Open the chat from the post page.",
                    );
                }
            });
        });

        // Try to open a conversation if the page provided sellerId or conversationId.
        // `ensureConversation` will return pageConversationId immediately if present,
        // or will attempt to create/get a conversation using `pageSellerId`.
        let conversationId = await ensureConversation(currentUserId);
        if (!conversationId && pageConversationId) conversationId = Number(pageConversationId);

        if (!conversationId) {
            // No conversation selected: disable input and instruct the user to choose one.
            console.log(
                "No conversation preselected. Click a conversation on the left or open this chat from a post.",
            );
            chatInputEl.disabled = true;
            chatFormEl.querySelector("button[type=submit]")?.setAttribute("disabled", "true");
        } else {
            // We have a conversation ID — enable input and load messages for it.
            chatInputEl.disabled = false;
            chatFormEl.querySelector("button[type=submit]")?.removeAttribute("disabled");
            await switchConversationById(conversationId);
        }

        // Submit handler for sending a message:
        // - Prevent default submit, validate a conversation is selected and text is not empty.
        // - Disable the input while sending, call `currentConversation.sendMessage()`,
        //   clear the input, and reload messages afterward.
        chatFormEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentConversation) {
                alert("Select a conversation before sending a message.");
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

        // Polling: start a setInterval that calls `loadMessages` every POLL_INTERVAL_MS.
        // A small helper `startPolling` clears previous intervals before starting.
        if (pollIntervalId) clearInterval(pollIntervalId);
        const startPolling = () => {
            if (pollIntervalId) clearInterval(pollIntervalId);
            pollIntervalId = setInterval(loadMessages, POLL_INTERVAL_MS);
        };

        startPolling();

        // Visibility-awareness:
        // - When the page becomes visible, immediately refresh messages and restart polling.
        // - When hidden, stop polling to conserve resources.
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                loadMessages(); // refresh immediately
                startPolling();
            } else {
                if (pollIntervalId) clearInterval(pollIntervalId);
            }
        });

        // Clear polling on page unload to avoid timers lingering.
        window.addEventListener("beforeunload", () => {
            if (pollIntervalId) clearInterval(pollIntervalId);
        });
    } catch (err) {
        // Top-level init errors are logged — do not rethrow so the page remains usable.
        console.error("Init chat error:", err);
    }
}

// Guard against double initialization in case this script is included twice.
// If the global flag exists, skip calling init again.
if (window.__sunnifyChatInit) {
    console.log("Chat script already initialized, skipping duplicate init.");
} else {
    window.__sunnifyChatInit = true;
    init();
}