import Message from "./Classes/message.js";
import Conversation from "./Classes/conversation.js";

// Constants
const MESSAGE_POLLING_INTERVAL_MS = 2000;

// Define the variables that will hold the chat data
let conversations = [];
let currentConversation = null;
let currentUserId = null;
let currentUsername = null;

const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get("conversationId");
const postId = urlParams.get("postId");
const sellerId = urlParams.get("sellerId");

// Global variables to make it easier to access the data from the console for debugging
window.conversations = conversations;
window.currentUser = currentUserId;
window.currentConversation = currentConversation;

// Delete stuff
let selectedConversations = [];
const deleteBtn = document.getElementById("deleteConversationsBtn");
const deleteCount = document.getElementById("deleteCount");
const conversationsList = document.getElementById("conversationsList");

// Message polling variables
let activePoller = null;
let lastMessageId = 0;

// HELPER FUNCTIONS

// Helper function to update the product header
function updateProductHeader(conversation) {
    document.getElementById("chatProductTitle").textContent = conversation.postTitle || "";
    document.getElementById("chatProductPrice").textContent = conversation.postPrice
        ? conversation.postPrice + "€"
        : "";
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
    currentUserId = data.userId;
    currentUsername = data.username;
    window.currentUser = currentUserId;
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

function addConversationToArray(conv) {
    if (conv) {
        conversations.push({
            convObj: new Conversation(conv.id, [conv.buyerId, conv.sellerId], [], conv.postId),
            buyer: conv.buyer,
            buyerId: conv.buyerId,
            seller: conv.seller,
            sellerId: conv.sellerId,
            postTitle: conv.postTitle,
            postPrice: conv.postPrice,
            postImages: conv.postImages,
            messages: conv.messages || []
        });
    }
}

// MAIN FUNCTIONS

// Load conversations from the backend
async function loadConversations() {
    const res = await fetch("/conversations", { credentials: "include" });
    const data = await res.json();
    conversations = [];
    data.conversations.forEach(conv => addConversationToArray(conv));
}

// Search for the conversation with the given id in the conversations array
async function selectConversation(conversation = null) {
    if (conversation) {
        // Set lastMessageId
        lastMessageId = conversation.messages[conversation.messages.length - 1]?.id || 0;
        console.log(lastMessageId);

        // Start polling loop
        startPollingMessages(conversation.convObj.id);

        currentConversation = conversation;
        window.currentConversation = currentConversation;
        // Update the product header when selecting a conversation
        updateProductHeader(conversation);
        console.log(conversation);

        // Show messages
        //showMsg();
    } else {
        // TODO: Select first in rendered list
        stopPollingMessages();
        console.log("No conversation selected");
    }
}

// Shows the list of conversations in the sidebar, with the product title and the other user's name
async function showConversationsList() {
    const listEl = document.getElementById("conversationsList");
    if (!listEl) return;
    listEl.innerHTML = "";

    console.log("Total conversations:", conversations.length);



    for (const conversation of conversations) {
        const convObj = conversation.convObj;
        const seller = conversation.seller;
        const buyer = conversation.buyer;
        const postTitle = conversation.postTitle;

        const otherUserId = convObj.users.find((id) => id !== currentUserId);
        console.log("Other user id:", otherUserId, `current user:`, currentUserId);

        if (!otherUserId || !convObj.postId) {
            console.log("Skipping conversation:", convObj.id);
            continue;
        }

        // Create button
        const btn = document.createElement("button");
        btn.className = "conversation-btn";
        btn.dataset.conversationId = convObj.id;
        btn.type = "button";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "conversation-checkbox";
        checkbox.dataset.conversationId = convObj.id;
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
        title.textContent = postTitle || "Product";

        // User
        const user = document.createElement("span");
        user.className = "text-muted small";
        const otherUser = conversation.sellerId === currentUserId
            ? buyer
            : seller;
        user.textContent = "with " + (otherUser || "User");

        // Append text to container
        textContainer.appendChild(title);
        textContainer.appendChild(user);

        // Append to button
        btn.appendChild(checkbox);
        btn.appendChild(textContainer);

        // Click para seleccionar conversación
        btn.addEventListener("click", (event) => {
            if (event.target !== checkbox) {
                selectConversation(conversation);
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
        const isSent = msg.sender_id == currentUserId;
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

    const res = await fetch(`/conversations/${currentConversation.convObj.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
    });

    if (res.ok && currentConversation) {  
        startPollingMessages(currentConversation.convObj.id);
    }
    else {
        console.error(`Failed to put message in database. HTTP ${res.status}`);
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

            // Stop polling messages (good catch here Anas)
            stopPollingMessages();

            // Load conversations again to refresh the list
            await loadConversations();

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


// Continuous message polling
const pollMessages = async (convId, poller) => {
    while (!poller.stopped) {
        try {
            const res = await fetch(`/conversations/${convId}/messages?afterId=${lastMessageId}`);

            if (!res.ok) {
                throw new Error(`Error fetching messages; HTTP ${res.status}`);
            }

            const data = await res.json();
            const newMessages = data.messages || [];

            if (newMessages.length > 0) {
                // Set new lastMessageId
                lastMessageId = newMessages[newMessages.length - 1].id;

                // Add messages to conversation list in order
                const conversation = conversations.find(conv => conv.convObj.id === convId);
                newMessages.forEach(msg => {
                    if (!conversation.messages.some(m => m.id === msg.id)) {
                        conversation.messages.push(msg);
                    }
                });
            }

            // Refresh displayed messages
            showMsg();
        } catch (error) {
            console.error(`Message polling failed for conversation with ID ${convId}: `, error);
        }

        // Wait before next poll attempt
        await new Promise(resolve => {
            poller.resolveFn = resolve;
            poller.timeoutId = setTimeout(resolve, MESSAGE_POLLING_INTERVAL_MS);
        });
    }
};

const startPollingMessages = (convId) => {
    // Stop previous poller
    stopPollingMessages();

    // Reset poller
    activePoller = {
        stopped: false,
        resolveFn: null,
        timeoutId: null
    };

    // Start asnychronous loop
    console.log("Starting new polling loop");
    pollMessages(convId, activePoller);
    console.log("Polling loop started");
};

const stopPollingMessages = () => {
    if (activePoller) {
        console.log("Stopping message polling");
        activePoller.stopped = true;
        if (activePoller.timeoutId) clearTimeout(activePoller.timeoutId);
        const resolveFn = activePoller.resolveFn;
        activePoller.resolveFn = null;
        resolveFn();
        activePoller = null;
        console.log("Message polling stopped");
    }
};


// INITIALIZATION

// Initialize the chat by loading the current user and conversations
(async function initChat() {
    await getCurrentUser();
    await loadConversations();

    let selectedConv = null;

    // Check if conversation needs to be created
    if (!conversationId) {
        // User can't message themselves
        if (sellerId && postId && Number(sellerId) === currentUserId) {
            console.log("Can't text yourself genius");
            window.location.href = "/";
            alert("You can't contact yourself dummy. Redirecting to homepage lol.");
            return;
        }

        const found = conversations.find(
            (conv) =>
                conv.convObj.postId == postId &&
                conv.convObj.users.includes(Number(sellerId))
        );
        selectedConv = found;

        if (!found && sellerId && postId) {
            // Attempt to create new conversation in DB
            const res = await fetch("/conversation/check-or-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    user1: Number(currentUserId),
                    user2: Number(sellerId),
                    postId: Number(postId),
                }),
            });
            const data = await res.json();

            // Add to conversations array
            if (res.ok && data.conversation) {
                const conv = data.conversation;
                addConversationToArray(conv);
                selectedConv = conversations[conversations.length - 1]; // FIX: use wrapped object
            }
        }
    }

    // Render the conversations
    console.log(conversations);
    await showConversationsList();

    // Select requested or created conversation
    await selectConversation(selectedConv);
})();
