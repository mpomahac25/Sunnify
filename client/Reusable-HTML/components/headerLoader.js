document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load header
        const container = document.getElementById("header-container");
        if (!container) return;

        const res = await fetch("/Reusable-HTML/components/header.html");
        const html = await res.text();
        container.innerHTML = html;
        
        // Set absolute href path(s)
        const navbarBrand = container.querySelector(".navbar-brand");
        const createPostButton = container.querySelector("#createpost-btn");
        const accountMenuContainer = container.querySelector("#account-menu-container");
        const chatLinkContainer = container.querySelector("#chat-link-container");

        navbarBrand.setAttribute("href", `/`);
        createPostButton?.setAttribute("href", `/createpost`);

        const response = await fetch(`/check-session`, {
            method: "get",
            credentials: "include"
        });

        const result = await response.json();

        if (result.loggedIn) {
            createPostButton?.classList.remove("d-none");

            //chatLinkContainer.innerHTML = `
            //    <a
            //        href="../page-examples/chatpage-example.html?sellerId=${result.userId}"
            //        class="btn btn-outline-primary rounded-square d-flex align-items-center justify-content-center"
            //        style="width: 42px; height: 42px;"
            //        aria-label="Chat"
            //    >
            //        <i class="bi bi-chat-dots fs-5"></i>
            //    </a>
            //`;

            const chatBtn = chatLinkContainer.querySelector("#chat-btn");
            chatBtn.setAttribute("href", `../page-examples/chatpage-example.html?sellerId=${result.userId}`);

            const accountMenuResponse = await fetch("/Reusable-HTML/components/accountMenu.html");
            const accountMenuHtml = await accountMenuResponse.text();
            accountMenuContainer.innerHTML = accountMenuHtml;

            //view profile btn
            const profileLink = container.querySelector("#view-profile-link");
            profileLink?.setAttribute("href", `/profile.html?id=${result.userId}`);
            
            //saved items btn
            const profileSavedItemsLink = container.querySelector("#view-profile-saved-items-link");
            profileSavedItemsLink?.setAttribute("href", `/profile.html?id=${result.userId}#saved-items`);

            //saved items btn
            const profileSettingsLink = container.querySelector("#view-profile-settings-link");
            profileSettingsLink?.setAttribute("href", `/profile.html?id=${result.userId}#settings`);

            const logoutButton = container.querySelector("#logout-btn");

            logoutButton.addEventListener("click", async (event) => {
                event.preventDefault();

                try {
                    const logoutResponse = await fetch(`/logout`, {
                        method: "post",
                        credentials: "include"
                    });

                    const logoutResult = await logoutResponse.json();

                    if (!logoutResponse.ok) {
                        alert(logoutResult.error || "Logout failed");
                        return;
                    }

                    //alert("Logout successful!");

                    window.location.href = "/main.html";
                } catch (error) {
                    alert("Unknown error occured!");
                    console.log(`Network error: ${error}`);
                }
            });
        } else {
            accountMenuContainer.innerHTML = `
                <a
                    href="/login.html"
                    class="btn btn-outline-primary rounded-square d-flex align-items-center justify-content-center"
                    style="width: 42px; height: 42px;"
                    aria-label="Login"
                >
                    <i class="bi bi-person-circle fs-5"></i>
                </a>
                `
        }
    } catch (error) {
        console.error(error);
    }
});
