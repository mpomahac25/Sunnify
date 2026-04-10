// client/js/postpage.js
// Page script that loads a single post by id and renders its details into the DOM.
// This copy adds explanatory comments in English but does not change any of the original code.

(() => {
    // Backend base URL used for post requests.
    const POST_BACKEND_ROOT_URL = "http://127.0.0.1:3000" || "http://localhost:3000";

    // Run code once the DOM is ready.
    document.addEventListener("DOMContentLoaded", async () => {
        // Read the `id` query parameter from the page URL.
        const params = new URLSearchParams(window.location.search);
        const postId = parseInt(params.get("id"));

        // Validate the id parsed from the URL.
        if (Number.isNaN(postId)) {
            // If invalid, render a "missing post" state and stop.
            renderMissingPost("Invalid post id.");
            return;
        }

        try {
            // Fetch the post data from the backend for the requested id.
            const response = await fetch(`${POST_BACKEND_ROOT_URL}/posts/${postId}`, {
                method: "get",
            });

            // Parse the JSON body returned by the server.
            const result = await response.json();

            // If the response had an HTTP error status, show a friendly message.
            if (!response.ok) {
                renderMissingPost(result.error || "Post could not be loaded.");
                return;
            }

            // Populate the page with the post data.
            renderPost(result);
        } catch (error) {
            // Network or unexpected error: log and show a network-error message.
            console.error(error);
            renderMissingPost("Network error while loading post.");
        }
    });

    // renderPost(post): populate DOM elements with the post's data.
    const renderPost = (post) => {
        setText("post-title", post.title);
        setText("post-price", formatPrice(post.price));
        setText("post-category", post.category);
        setText("post-location", post.location);
        setText("post-condition", `Condition: ${post.condition}`);
        setText("post-created-at", formatCreatedAt(post.created_at));
        setText("post-status", capitalize(post.status || "available"));
        setText("post-description", post.description);

        // Update the browser tab title to include the post title when available.
        document.title = post.title ? `${post.title} | Sunnify` : "Post | Sunnify";

        // (Original Spanish developer note left in place)
        // no hablar espanol mi amigo anas.
        
        // The API now returns the seller's username; display it or fall back to "Seller".
        setText("seller-name", post.seller_username || "Seller");

        // Add behavior to the "Contact seller" button: redirect to the chat page
        // and include the `sellerId` in the query string so the chat can open/create
        // the appropriate conversation.
        const contactBtn = document.querySelector(".post-details-card .btn.btn-primary");
        if (contactBtn) {
            contactBtn.addEventListener("click", () => {
                // Redirect to the example chat page with sellerId query param.
                window.location.href = `/page-examples/chatpage-example.html?sellerId=${post.seller_id}`;
            });
        }
    };

    // renderMissingPost(message): show a fallback view when post data cannot be loaded.
    const renderMissingPost = (message) => {
        setText("post-title", "Post unavailable");
        setText("post-price", "-");
        setText("post-category", "Unavailable");
        setText("post-location", "Unknown location");
        setText("post-condition", "Condition: Unknown");
        setText("post-created-at", "Posted date unavailable");
        setText("post-status", "Unavailable");
        setText("post-description", message);
    };

    // setText(id, value): helper that finds an element by id and sets its textContent.
    // Safely handles missing elements and uses nullish coalescing to avoid "undefined".
    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    };

    // formatPrice(price): normalize and format the price value for display.
    // Returns a human-friendly string or a fallback when price is invalid.
    const formatPrice = (price) => {
        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice)) {
            return "Price unavailable";
        }

        return `${parsedPrice} EUR`;
    };

    // formatCreatedAt(createdAt): convert an ISO date/time string to a readable label.
    // Validates the date and returns a fallback when missing or invalid.
    const formatCreatedAt = (createdAt) => {
        if (!createdAt) {
            return "Posted date unavailable";
        }

        const date = new Date(createdAt);

        // Validate the parsed date.
        if (Number.isNaN(date.getTime())) {
            return "Posted date unavailable";
        }

        // Use the browser locale to format the date portion.
        return `Posted ${date.toLocaleDateString()}`;
    };

    // capitalize(value): upper-case the first character and return the rest unchanged.
    // Used to make status labels like "available" look nicer ("Available").
    const capitalize = (value) => {
        if (!value) {
            return "";
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };
})();