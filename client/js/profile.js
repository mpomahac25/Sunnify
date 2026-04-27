import { createPostCard } from "../Reusable-HTML/components/postCard.js";

(() => {
    let pendingDeletePostId = null;
    let currentSettings = null;
    let pendingSettingsChanges = null;

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

            // Setup settings area
            setupSettingsArea(isOwnProfile);

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



    // Settings-related functions
    const setupSettingsArea = (isOwnProfile) => {
        const settingsSection = document.getElementById("settings");
        const settingsNavItem = document.getElementById("settings-nav-item");
        const manageSettingsButton = document.getElementById("manage-settings-btn");
        const settingsContainer = document.getElementById("settings-container");
        const confirmButton = document.getElementById("settings-confirm-btn");
        const passwordInput = document.getElementById("settings-confirm-password");
        const passwordModalElement = document.getElementById("confirm-settings-password-modal");

        if (!settingsSection || !manageSettingsButton || !settingsContainer) {
            return;
        }

        if (!isOwnProfile) {
            settingsSection.classList.add("d-none");
            settingsNavItem?.classList.add("d-none");
            return;
        }

        settingsSection.classList.remove("d-none");
        settingsNavItem?.classList.remove("d-none");

        const passwordModal = passwordModalElement
            ? bootstrap.Modal.getOrCreateInstance(passwordModalElement)
            : null;

        manageSettingsButton.addEventListener("click", async () => {
            if (settingsContainer.innerHTML.trim()) {
                return;
            }

            await loadAndRenderSettingsForm();
        });

        confirmButton?.addEventListener("click", async () => {
            if (!pendingSettingsChanges) {
                return;
            }

            const currentPassword = passwordInput?.value || "";

            if (!currentPassword.trim()) {
                showSettingsPasswordError("Please enter your password.");
                return;
            }

            try {
                const response = await fetch("/user/settings", {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...pendingSettingsChanges,
                        currentPassword
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    showSettingsPasswordError(result.error || "Settings update failed.");
                    return;
                }

                currentSettings = result;
                pendingSettingsChanges = null;

                if (passwordInput) {
                    passwordInput.value = "";
                }

                hideSettingsPasswordError();
                passwordModal?.hide();

                settingsContainer.innerHTML = "";
                setText("profile-name", result.username);

                alert("Settings updated.");
            } catch (error) {
                console.error(error);
                showSettingsPasswordError("Network error while updating settings.");
            }
        });

        passwordModalElement?.addEventListener("hidden.bs.modal", () => {
            pendingSettingsChanges = null;

            if (passwordInput) {
                passwordInput.value = "";
            }

            hideSettingsPasswordError();
        });
    };

    const loadAndRenderSettingsForm = async () => {
        const settingsContainer = document.getElementById("settings-container");

        if (!settingsContainer) {
            return;
        }

        try {
            const response = await fetch("/user/settings", {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || "Settings could not be loaded.");
                return;
            }

            currentSettings = result;
            await renderSettingsForm(result);
        } catch (error) {
            console.error(error);
            alert("Network error while loading settings.");
        }
    };

    const renderSettingsForm = async (settings) => {
        const settingsContainer = document.getElementById("settings-container");

        // No settings container found, skip rendering
        if (!settingsContainer) {
            return;
        }

        try {
            const response = await fetch("/Reusable-HTML/components/settingsContainer.html");

            if (!response.ok) {
                alert("Settings form could not be loaded.");
                return;
            }

            settingsContainer.innerHTML = await response.text();

            const usernameInput = document.getElementById("settings-username");
            const emailInput = document.getElementById("settings-email");
            const newPasswordInput = document.getElementById("settings-new-password");

            const applyBtn = document.getElementById("settings-apply-btn");
            const cancelBtn = document.getElementById("settings-cancel-btn");

            if (usernameInput) {
                usernameInput.value = settings.username || "";
            }

            if (emailInput) {
                emailInput.value = settings.email || "";
            }

            if (newPasswordInput) {
                newPasswordInput.value = "";
            }

            cancelBtn?.addEventListener("click", () => {
                settingsContainer.innerHTML = "";
            });

            applyBtn?.addEventListener("click", () => {
                handleSettingsApply();
            });
        } catch (error) {
            console.error(error);
            alert("Network error while loading the settings form.");
        }
    };

    const handleSettingsApply = () => {
        if (!currentSettings) {
            return;
        }

        const usernameInput = document.getElementById("settings-username");
        const emailInput = document.getElementById("settings-email");
        const newPasswordInput = document.getElementById("settings-new-password");

        const username = usernameInput?.value.trim() || "";
        const email = emailInput?.value.trim() || "";
        const newPassword = newPasswordInput?.value || "";

        const usernameChanged = username !== currentSettings.username;
        const emailChanged = email !== currentSettings.email;
        const passwordChanged = newPassword.trim() !== "";

        if (!usernameChanged && !emailChanged && !passwordChanged) {
            alert("No changes to apply.");
            return;
        }

        if (!username) {
            alert("Username cannot be empty.");
            return;
        }

        if (!email || !email.includes("@")) {
            alert("Please enter a valid email.");
            return;
        }

        pendingSettingsChanges = {
            username,
            email,
            newPassword
        };

        const passwordInput = document.getElementById("settings-confirm-password");
        const passwordModalElement = document.getElementById("confirm-settings-password-modal");

        if (passwordInput) {
            passwordInput.value = "";
        }

        hideSettingsPasswordError();

        const passwordModal = passwordModalElement
            ? bootstrap.Modal.getOrCreateInstance(passwordModalElement)
            : null;

        passwordModal?.show();

        setTimeout(() => {
            passwordInput?.focus();
        }, 200);
    };

    const showSettingsPasswordError = (message) => {
        const passwordError = document.getElementById("settings-confirm-error");

        if (!passwordError) {
            return;
        }

        passwordError.textContent = message;
        passwordError.classList.remove("d-none");
    };

    const hideSettingsPasswordError = () => {
        const passwordError = document.getElementById("settings-confirm-error");

        if (!passwordError) {
            return;
        }

        passwordError.textContent = "";
        passwordError.classList.add("d-none");
    };
})();
