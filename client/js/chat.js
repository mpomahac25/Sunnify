import Message from "./Classes/message.js";
import Conversation from "./Classes/conversation.js";

// Define the variables that will hold the chat data
let conversations = [];
let currentConversation = null;
let currentUser = null;

const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get("conversationId");
const postId = urlParams.get("postId");
const sellerId = urlParams.get("sellerId");

// Global variables to make it easier to access the data from the console for debugging
window.conversations = conversations;
window.currentUser = currentUser;
window.currentConversation = currentConversation;

// Delete stuff
let selectedConversations = [];
const deleteBtn = document.getElementById("deleteConversationsBtn");
const deleteCount = document.getElementById("deleteCount");
const conversationsList = document.getElementById("conversationsList");

// HELPER FUNCTIONS

// Helper function to update the product header
function updateProductHeader(postId) {
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

// Format the date to show only the time in a more readable format
function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

// Get the current user from the backend when the page loads
async function getCurrentUser() {
    const res = await fetch("/check-session", { credentials: "include" });
    const data = await res.json();
    currentUser = data.userId;
    window.currentUser = currentUser;
}

function updateDeleteButton() {
    if (selectedConversations.length > 0) {
        deleteBtn.classList.remove("d-none");
        deleteCount.textContent = selectedConversations.length;
    } else {
        deleteBtn.classList.add("d-none");
        deleteCount.textContent = 0;
    }
}

// MAIN FUNCTIONS

// Load conversations from the backend
async function loadConversations() {
    const res = await fetch("/conversations", { credentials: "include" });
    const data = await res.json();
    conversations = data.conversations.map(
        (conv) => new Conversation(conv.id, [conv.user1_id, conv.user2_id], [], conv.post_id),
    );
    window.conversations = conversations;
    showConversationsList();

    if (conversationId) {
        await selectConversation(conversationId);
    } else if (sellerId && postId) {
        if (Number(sellerId) === currentUser) {
            console.log("Can't text yourself genius");
            window.location.href = "/";
            alert("You can't contact yourself dummy. Redirecting to homepage lol.");
            return;
        }

        const found = conversations.find(
            (conv) => conv.post_id == postId && conv.users.includes(Number(sellerId)),
        );
        if (found) {
            await selectConversation(found.id);
        } else {
            const res = await fetch("/conversation/check-or-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    user1: currentUser,
                    user2: Number(sellerId),
                    postId: Number(postId),
                }),
            });
            const data = await res.json();
            if (res.ok && data.conversationId) {
                await loadConversations();
            }
        }
    }
}

// Search for the conversation with the given id in the conversations array
async function selectConversation(id) {
    const found = conversations.find((conv) => Number(conv.id) === Number(id));
    if (found) {
        currentConversation = found;
        window.currentConversation = currentConversation;
        // Update the product header when selecting a conversation
        updateProductHeader(found.post_id);
        // Load messages for the selected conversation from the backend
        const res = await fetch(`/conversations/${id}/messages`, { credentials: "include" });
        const data = await res.json();
        currentConversation.messages = data.messages.map(
            (msg) =>
                new Message(
                    msg.id,
                    msg.content,
                    msg.sent_at,
                    msg.sender_id,
                    msg.receiver_id,
                    msg.conversation_id,
                ),
        );
        showMsg();
    } else {
        console.log("No conversation found with that id");
    }
}

// Shows the list of conversations in the sidebar, with the product title and the other user's name
async function showConversationsList() {
    const listEl = document.getElementById("conversationsList");
    if (!listEl) return;
    listEl.innerHTML = "";

    console.log("Total conversations:", conversations.length);

    for (const conversation of conversations) {
        const otherUserId = conversation.users.find((id) => id !== currentUser);
        console.log("Other user id:", otherUserId, `current user:`, currentUser);

        if (!otherUserId || !conversation.post_id) {
            console.log("Skipping conversation:", conversation.id);
            continue;
        }

        // Fetch user and post data
        const userRes = await fetch(`/users/${otherUserId}`);
        const postRes = await fetch(`/posts/${conversation.post_id}`);

        const userData = await userRes.json();
        const postData = await postRes.json();

        // Create button
        const btn = document.createElement("button");
        btn.className = "conversation-btn";
        btn.dataset.conversationId = conversation.id;
        btn.type = "button";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "conversation-checkbox";
        checkbox.dataset.conversationId = conversation.id;
        checkbox.tabIndex = 0;
        checkbox.addEventListener("change", (event) => {
            event.stopPropagation();
            const id = Number(event.target.dataset.conversationId);

            if (event.target.checked) {
                if (!selectedConversations.includes(id)) {
                    selectedConversations.push(id);
                }
            } else {
                const index = selectedConversations.indexOf(id);
                if (index > -1) {
                    selectedConversations.splice(index, 1);
                }
            }
            
            updateDeleteButton();
        });

        // Container for text
        const textContainer = document.createElement("span");
        textContainer.style.flex = "1";
        textContainer.style.minWidth = "0";

        // Title
        const title = document.createElement("span");
        title.className = "fw-semibold";
        title.textContent = postData.title || "Product";

        // User
        const user = document.createElement("span");
        user.className = "text-muted small";
        user.textContent = "with " + (userData.username || "User");

        // Append text to container
        textContainer.appendChild(title);
        textContainer.appendChild(user);

        // Append to button
        btn.appendChild(checkbox);
        btn.appendChild(textContainer);

        // Click para seleccionar conversación
        btn.addEventListener("click", (event) => {
            if (event.target !== checkbox) {
                selectConversation(conversation.id);
            }
        });

        listEl.appendChild(btn);
    }
}

// This function will be called when the user clicks on a conversation,
// it will set the current conversation and show the messages of that conversation
function showMsg() {
    const messagesEl = document.getElementById("messagesListEl");
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    if (!currentConversation) return;

    currentConversation.messages.forEach((msg) => {
        const isSent = msg.sender_id == currentUser;
        const article = document.createElement("article");
        article.className = isSent ? "message-sent" : "message-received";
        article.innerHTML = `<div class="message-text">${msg.text || msg.content}</div><div class="message-time">${formatTime(msg.date || msg.sent_at)}</div>`;
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
        await selectConversation(currentConversation.id);
    }
}

// Delete the selected conversations
async function deleteSelectedConversations() {
    try {
        const res = await fetch("/conversations", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ conversationIds: selectedConversations }),
        });
        if (res.ok) {
            selectedConversations = [];
            updateDeleteButton();
            // Clean the current conversation if it was among the deleted ones
            currentConversation = null;
            window.currentConversation = currentConversation;
            // Load conversations again to refresh the list
            const res2 = await fetch("/conversations", { credentials: "include" });
            const data = await res2.json();
            conversations = data.conversations.map(
                (conv) =>
                    new Conversation(conv.id, [conv.user1_id, conv.user2_id], [], conv.post_id),
            );
            window.conversations = conversations;
            showConversationsList();
            // Clean the messages on the screen
            document.getElementById("messagesListEl").innerHTML = "";
            document.getElementById("chatProductTitle").textContent = "";
            document.getElementById("chatProductPrice").textContent = "";
        } else {
            alert("Couldn't delete conversations. Please try again.");
        }
    } catch {
        alert("Network error. Please try again.");
    }
}

// EVENT LISTENERS

// Event listener for sending messages
document.getElementById("chatFormEl").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("chatInputEl");
    const text = input.value.trim();
    if (text) {
        await sendMsg(text);
        input.value = "";
    }
});

// Event listener for delete button
deleteBtn.addEventListener("click", async () => {
    const plural = selectedConversations.length > 1;
    const msg = plural
        ? `Delete ${selectedConversations.length} conversations?`
        : "Delete this conversation?";
    if (!confirm(msg)) return;
    await deleteSelectedConversations();
});

// INITIALIZATION

// Initialize the chat by loading the current user and conversations
(async function initChat() {
    await getCurrentUser();
    await loadConversations();
})();
