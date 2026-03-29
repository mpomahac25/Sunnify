const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${BACKEND_ROOT_URL}/check-session`, {
            method: "get",
            credentials: "include"
        });

        const result = await response.json();

        if (result.loggedIn) {
            // Change login button to logout button
            const loginLogoutButton = document.getElementById("login-logout-btn");

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
                        alert(result.error || "Login failed");
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
})
