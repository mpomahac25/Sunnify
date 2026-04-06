( () => {
    const PROFILE_BACKEND_ROOT_URL = "http://127.0.0.1:3000";

    document.addEventListener("DOMContentLoaded", () => {
        const params = new URLSearchParams(window.location.search);
        const userId =  parseInt(params.get("id"));

        if (Number.isNaN(postId)) {
            renderMissingPost("Invalid post id.");
            return;
        }

        try {

        } catch (error) {
            console.error(error)
        }
    })

    const RenderProfile = (profile) => {

    }

})
// <button class="btn btn-outline-primary padding-bottom-6 mb-4" id="edit-profile-btn">Edit Profile</button>