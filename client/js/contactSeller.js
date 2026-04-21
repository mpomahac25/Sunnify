// Contact Seller functionality

// Get the logged in user id
async function getCurrentUserId() {
    const res = await fetch(`/check-session`, { credentials: `include` });
    const data = await res.json();
    return data.userId;
}

// Get the contact seller button and its data attributes for post id and seller id
const contactBtn = document.getElementById("contactSellerBtn");

// Get the post id
const postId = contactBtn?.getAttribute("data-post-id");

// Get the seller id
const sellerId = contactBtn?.getAttribute("data-seller-id");

contactBtn?.addEventListener("click", async () => {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId || !sellerId) {
        alert("Couldn't get user or seller id.");
        return;
    }
    const res = await fetch("/conversation/check-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user1: currentUserId, user2: Number(sellerId), postId: Number(postId) }),
    });
    
    const data = await res.json();
    if (res.ok) {
        window.location.href = `/page-examples/chatpage-example.html?conversationId=${data.conversationId}&postId=${postId}`;
    } else {
        alert(data.error || "Couldn't initiate chat.");
    }
});
