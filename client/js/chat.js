import Message from "./Classes/message.js";
import Conversation from "./Classes/conversation.js";

// chat.js defines the main logic of the chat, how the conversations and messages will be handled, created, stored shown and sent
// Here I'll decide how the chat will work and how to use the conversation and message classes to make the chat work

// Define the variables that will hold the chat data
// camelCase is used for the variables to follow the JavaScript naming convention
let conversations = [];
let currentConversation = null;
let currentUser = null;

const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get("conversationId");
const postId = urlParams.get("postId");
const sellerId = urlParams.get("sellerId");

// Main functions of the chat

// Load conversations from the backend
async function loadConversations() {
    const res = await fetch("/conversations", { credentials: "include" });
    const data = await res.json();
    conversations = data.conversations.map(
        (conv) => new Conversation(conv.id, [conv.user1_id, conv.user2_id], [], conv.post_id),
    );
    showConversationsList();

    if (conversationId) {
        await selectConversation(conversationId);
    } else if (sellerId && postId) {
        // Searches if there's already a conversation for that post and seller, if there is, select it
        const found = conversations.find(
            (conv) => conv.post_id == postId && conv.users.includes(Number(sellerId)),
        );
        if (found) {
            await selectConversation(found.id);
        } else {
            // If it doesn't exist, create it and then select it
            const res = await fetch("/conversation/check-or-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ user1: currentUser, user2: Number(sellerId) }),
            });
            const data = await res.json();
            if (res.ok && data.conversationId) {
                await selectConversation(data.conversationId);
            }
        }
    }
}

// Format the date to show only the time in a more readable format
function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

// This function will be called when the user clicks on a conversation, it will set the current conversation and show the messages of that conversation
function showMsg() {
    const messagesEl = document.getElementById("messagesListEl");
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    if (!currentConversation) return;

    currentConversation.messages.forEach((msg) => {
        const isSent = msg.sender_id == currentUser;
        const article = document.createElement("article");
        article.className = isSent ? "message-sent" : "message-received";
        article.innerHTML = `
            <div class="message-text">${msg.text || msg.content}</div>
            <div class="message-time">${formatTime(msg.date || msg.sent_at)}</div>
        `;
        messagesEl.appendChild(article);
    });
}

// This function will be called when the user sends a message
async function sendMsg(text) {
    if (!currentConversation) {
        console.log("There is no conversation selected");
        return;
    }
    const res = await fetch(`/conversations/${currentConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
    });
    if (res.ok) {
        // Recarga los mensajes
        await selectConversation(currentConversation.id);
    }
}

// Search for the conversation with the given id in the conversations array
async function selectConversation(id) {
    const found = conversations.find((conv) => Number(conv.id) === Number(id));
    if (found) {
        currentConversation = found;
        // Load messages for the selected conversation from the backend
        const res = await fetch(`/conversations/${id}/messages`, { credentials: "include" });
        const data = await res.json();
        currentConversation.messages = data.messages.map((msg) => new Message(msg));
        showMsg();
    } else {
        console.log("No conversation found with that id");
    }
}
// Shows the list of available conversations with their id and users
function showConversationsList() {
    const listEl = document.getElementById("conversationsList");
    if (!listEl) return;
    listEl.innerHTML = "";
    conversations.forEach((conversation) => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-secondary w-100 text-start";
        btn.textContent = `Conversación #${conversation.id} (${conversation.users.join(", ")})`;
        btn.onclick = () => selectConversation(conversation.id);
        listEl.appendChild(btn);
    });
}

// Get the current user from the backend when the page loads
async function getCurrentUser() {
    const res = await fetch("/check-session", { credentials: "include" });
    const data = await res.json();
    currentUser = data.userId;
}

// Event listeners
document.getElementById("chatFormEl").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInputEl");
    const text = input.value.trim();
    if (text) {
        await sendMsg(text);
        input.value = "";
    }
});

// Initialize the chat by loading the current user and conversations
(async function initChat() {
    await getCurrentUser();
    await loadConversations();
})();

// If theres postId, load the product data
if (postId) {
    fetch(`/posts/${postId}`)
        .then((res) => res.json())
        .then((post) => {
            document.getElementById("chatProductTitle").textContent = post.title || "";
            document.getElementById("chatProductPrice").textContent = post.price
                ? post.price + "€"
                : "";
            document.getElementById("chatProductModel").textContent = post.model || "";
        });
}

loadConversations();
