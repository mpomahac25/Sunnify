import { createPostCard } from "../Reusable-HTML/components/postCard.js";

(() => {
    const PROFILE_BACKEND_ROOT_URL = "http://127.0.0.1:3000";

    document.addEventListener("DOMContentLoaded", async () => {
        const params = new URLSearchParams(window.location.search);
        const userId =  parseInt(params.get("id"));

        if (Number.isNaN(userId)) {
            renderMissingPost("Invalid profile id.");
            return;
        }

        
        try {
            const profileResponse = await fetch(`${PROFILE_BACKEND_ROOT_URL}/users/${userId}`, {
                method: "get"
            });

            const profileResult = await profileResponse.json();

            if (!profileResponse.ok) {
                renderMissingProfile(profileResult.error || "Profile could not be loaded.");
                return;
            }

            renderProfile(profileResult);

            const postsResponse = await fetch(`/users/${userId}/posts`);
            const postsResult = await postsResponse.json();

            renderProfilePosts(postsResult)
        } catch (error) {
            console.error(error)
        }
    })

    const renderProfile = (profile) => {
        setText("profile-name", profile.username);
        //setText("profile-rating", ;
        setText("profile-posts-count", profile.posts_count);
        //setText("profile-saved-posts-count", )
        setText("profile-created-at", formatMemberSince(profile.created_at));
    }

    const renderMissingProfile = () => {
        setText("profile-name", "Profile unavailable");
        setText("profile-rating", "-");
        setText("profile-posts-count", "Unavailable");
        setText("profile-saved-posts-count", "-");
        setText("profile-created-at", "Posted date unavailable");
    };

    // Profile listings
    const renderProfilePosts = (posts) => {
        const postsList = document.getElementById("profile-posts-list");

        if (!postsList) {
            return;
        }

        if (posts.length === 0) {
            postsList.innerHTML = `<p class="text-muted">This user has no listings yet.</p>`;
            return;
        }

        postsList.innerHTML = "";

        posts.forEach(post => {
            const postCard = createPostCard(post, {
                columnClassName: "col-12 col-md-6 col-xl-4",
                showFavoriteButton: false
            });
            postsList.appendChild(postCard);
        });

        if (typeof window.loadCarousels === "function") {
            window.loadCarousels(postsList);
        }
    };

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    };

    const formatMemberSince = (memberSince) => {
    if (!memberSince) {
        return "Member since unavailable";
    }

    const date = new Date(memberSince);

    if (Number.isNaN(date.getTime())) {
        return "Member since unavailable";
    }

    return `${date.toLocaleDateString()}`;
};
})();
