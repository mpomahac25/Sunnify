(() => {
    const POST_BACKEND_ROOT_URL = "http://127.0.0.1:3000";

    document.addEventListener("DOMContentLoaded", async () => {
        // gets id from url
        const params = new URLSearchParams(window.location.search);
        const postId = parseInt(params.get("id"));

        // checks id
        if (Number.isNaN(postId)) {
            renderMissingPost("Invalid post id.");
            return;
        }

        try {
            //response to server
            const response = await fetch(`${POST_BACKEND_ROOT_URL}/posts/${postId}`, {
                method: "get"
            });

            const result = await response.json();

            //checks response
            if (!response.ok) {
                renderMissingPost(result.error || "Post could not be loaded.");
                return;
            }

            // adds data to html
            renderPost(result);
        } catch (error) {
            console.error(error);
            renderMissingPost("Network error while loading post.");
        }
    });
    const renderPost = (post) => {
        setText("post-title", post.title);
        setText("post-price", formatPrice(post.price));
        setText("post-category", post.category);
        setText("post-location", post.location);
        setText("post-condition", `Condition: ${post.condition}`);
        setText("post-created-at", formatCreatedAt(post.created_at));
        setText("post-status", capitalize(post.status || "available"));
        setText("post-description", post.description);

        document.title = post.title ? `${post.title} | Sunnify` : "Post | Sunnify";
    };

    // if data not found
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

    // finds elem by id. if it exists - changes text
    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    };

    // price becomes a number
    const formatPrice = (price) => {
        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice)) {
            return "Price unavailable";
        }

        return `${parsedPrice} EUR`;
    };

    // checks if date's ok
    const formatCreatedAt = (createdAt) => {
        if (!createdAt) {
            return "Posted date unavailable";
        }

        const date = new Date(createdAt);

        // validation
        if (Number.isNaN(date.getTime())) {
            return "Posted date unavailable";
        }

        return `Posted ${date.toLocaleDateString()}`;
    };
    // status available => Available
    const capitalize = (value) => {
        if (!value) {
            return "";
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };
})();
