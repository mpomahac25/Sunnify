const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

//document.addEventListener("DOMContentLoaded", () => {
//    const container = document.getElementById("header-container");
//    const brandHref = container?.dataset?.brandHref;
//    const loginText = container?.dataset?.loginText;
//    const loginHref = container?.dataset?.loginHref;

//    fetch("/Reusable-HTML/components/header.html")
//        .then(response => response.text())
//        .then(html => {
//            if (!container) return;
//            container.innerHTML = html;

//            if (brandHref) {
//                const brand = container.querySelector('.navbar-brand');
//                if (brand) brand.setAttribute('href', brandHref);
//            }

//            const loginBtn = container.querySelector('#login-logout-btn');
//            if (loginBtn) {
//                if (loginText) loginBtn.textContent = loginText;
//                if (loginHref) loginBtn.setAttribute('href', loginHref);
//            }
//        });
//});

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

        navbarBrand.setAttribute("href", `${BACKEND_ROOT_URL}`);
        createPostButton?.setAttribute("href", `${BACKEND_ROOT_URL}/createpost`);

        const response = await fetch(`${BACKEND_ROOT_URL}/check-session`, {
            method: "get",
            credentials: "include"
        });

        const result = await response.json();

        if (result.loggedIn) {
            // Change login button to logout button
            const loginLogoutButton = container.querySelector("#login-logout-btn");
            createPostButton?.classList.remove("d-none");

            loginLogoutButton.textContent = "Logout";

            loginLogoutButton.classList.remove("btn-outline-primary");
            loginLogoutButton.classList.add("btn-outline-danger");

            loginLogoutButton.removeAttribute("href");

            loginLogoutButton.addEventListener("click", async (event) => {
                event.preventDefault();

                try {
                    const response = await fetch(`${BACKEND_ROOT_URL}/logout`, {
                        method: "post",
                        credentials: "include"
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        alert(result.error || "Logout failed");
                        return;
                    }

                    //alert("Logout successful!");

                    window.location.href = "main.html";
                } catch (error) {
                    alert("Unknown error occured!");
                    console.log(`Network error: ${error}`);
                }
            })
        }
        else {
            document.body.classList.remove("hidden");
        }
    } catch (error) {
        console.error(error);
        document.body.classList.remove("hidden");
    }
});
