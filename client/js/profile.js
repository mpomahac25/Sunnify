import { createPostCard } from "../Reusable-HTML/components/postCard.js";

(() => {
    let pendingDeletePostId = null;

    document.addEventListener("DOMContentLoaded", async () => {
        const params = new URLSearchParams(window.location.search);
        const userId = parseInt(params.get("id"));
        let isOwnProfile = false;

        if (Number.isNaN(userId)) {
            renderMissingProfile("Invalid profile id.");
            return;
        }

        const deletePostModalElement = document.getElementById("delete-post-modal");
        const confirmDeletePostButton = document.getElementById("confirm-delete-post-btn");

        const deletePostModal = deletePostModalElement
            ? new bootstrap.Modal(deletePostModalElement)
            : null;

        confirmDeletePostButton?.addEventListener("click", async () => {
            if (!pendingDeletePostId) {
                return;
            }

            try {
                const response = await fetch(`/posts/${pendingDeletePostId}`, {
                    method: "delete",
                    credentials: "include"
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(result.error || "Delete failed.");
                    return;
                }

                deletePostModal?.hide();
                pendingDeletePostId = null;
                await loadProfilePosts(userId, isOwnProfile);
            } catch (error) {
                console.error(error);
                alert("Network error while deleting post.");
            }
        });

        try {
            const sessionResponse = await fetch(`/check-session`, {
                method: "get",
                credentials: "include"
            });

            const sessionResult = await sessionResponse.json();
            const sessionUserId = sessionResult.loggedIn ? sessionResult.userId : null;

            isOwnProfile = sessionUserId === userId;

            const profileResponse = await fetch(`/users/${userId}`, {
                method: "get"
            });

            const profileResult = await profileResponse.json();

            if (!profileResponse.ok) {
                renderMissingProfile(profileResult.error || "Profile could not be loaded.");
                return;
            }

            renderProfile(profileResult);
            await loadProfilePosts(userId, isOwnProfile);
        } catch (error) {
            console.error(error);
            renderMissingProfile("Network error while loading profile.");
        }
    });

    const renderProfile = (profile) => {
        setText("profile-name", profile.username);
        setText("profile-posts-count", profile.posts_count);
        setText("profile-created-at", formatMemberSince(profile.created_at));
        //setText("profile-rating", profile.rating)
        //setText("profile-saved-posts-count", profile.saved_posts_count)
    };

    const renderMissingProfile = (message) => {
        setText("profile-name", "Profile unavailable");
        //setText("profile-rating", "aaaaa");
        setText("profile-posts-count", "Unavailable");
        //setText("profile-saved-posts-count", "aaaa");
        setText("profile-created-at", message || "Member since unavailable");
    };

    const loadProfilePosts = async (userId, isOwnProfile) => {
        const postsResponse = await fetch(`/users/${userId}/posts`, {
            method: "get"
        });

        const postsResult = await postsResponse.json();

        if (!postsResponse.ok) {
            throw new Error(postsResult.error || "Profile listings could not be loaded.");
        }

        renderProfilePosts(postsResult, isOwnProfile);
    };

    const renderProfilePosts = (posts, isOwnProfile) => {
        const postsList = document.getElementById("profile-posts-list");

        if (!postsList) {
            return;
        }

        if (posts.length === 0) {
            postsList.innerHTML = `<p class="text-muted">This user has no listings yet.</p>`;
            return;
        }

        postsList.innerHTML = "";

        posts.forEach((post) => {
            const postCard = createPostCard(post, {
                columnClassName: "col-12 col-md-6 col-xl-4",
                showFavoriteButton: false
            });

            if (isOwnProfile) {
                attachPostManagementActions(postCard, post);
            }

            postsList.appendChild(postCard);
        });

        if (typeof window.loadCarousels === "function") {
            window.loadCarousels(postsList);
        }
    };

    const attachPostManagementActions = (postCard, post) => {
        const card = postCard.querySelector(".img-container.card");

        if (!card) {
            return;
        }

        const actionsWrapper = document.createElement("div");
        actionsWrapper.className = "card-footer d-flex justify-content-between align-items-center gap-2";

        const editButton = document.createElement("button");
        editButton.className = "btn btn-outline-primary btn-sm";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = `editpost.html?id=${post.id}`;
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-outline-danger btn-sm";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            pendingDeletePostId = post.id;

            const deletePostModalElement = document.getElementById("delete-post-modal");

            if (!deletePostModalElement) {
                return;
            }

            const deletePostModal = bootstrap.Modal.getOrCreateInstance(deletePostModalElement);
            deletePostModal.show();
        });

        actionsWrapper.appendChild(editButton);
        actionsWrapper.appendChild(deleteButton);
        card.appendChild(actionsWrapper);
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
