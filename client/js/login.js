import { checkFullUsername } from "./validation/username.js";
import { checkEmailFormat } from "./validation/email.js";
import { checkFullPassword } from "./validation/password.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${BACKEND_ROOT_URL}/check-session`, {
            method: "get",
            credentials: "include"
        });

        const result = await response.json();

        if (result.loggedIn) {
            // Later on change to user account management page
            window.location.href = "main.html";
        }
        else {
            document.body.classList.remove("hidden");
        }
    } catch (error) {
        console.error(error);
        document.body.classList.remove("hidden");
    }
});

const form = document.querySelector(".auth-form");

const usernameOrEmailField = document.getElementById("username-or-email");
const usernameOrEmailErrorSpan = document.getElementById("username-or-email-span");

const passwordField = document.getElementById("password");
const passwordErrorSpan = document.getElementById("password-span");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usernameOrEmail = usernameOrEmailField.value.trim();
    const password = passwordField.value.trim();

    // Simple validation of parameters, mainly for additional security against SQL injection
    let dataIsValid = true;
    let errorMessage;

    // Validate username/email
    if (usernameOrEmail === "") {
        dataIsValid = false;
        errorMessage = "This field cannot be empty!";
        displayInputError(usernameOrEmailField, usernameOrEmailErrorSpan, errorMessage);
    }
    else {
        if (usernameOrEmail.includes("@")) errorMessage = checkEmailFormat(usernameOrEmail);
        else errorMessage = checkFullUsername(usernameOrEmail);

        if (errorMessage) {
            dataIsValid = false;
            displayInputError(usernameOrEmailField, usernameOrEmailErrorSpan, errorMessage);
        }
        else hideInputError(usernameOrEmailField, usernameOrEmailErrorSpan);
    }

    // Validate password
    if (password === "") {
        dataIsValid = false;
        errorMessage = "This field cannot be empty!";
        displayInputError(passwordField, passwordErrorSpan, errorMessage);
    }
    else {
        errorMessage = checkFullPassword(password);

        if (errorMessage) {
            dataIsValid = false;
            displayInputError(passwordField, passwordErrorSpan, errorMessage);
        }
        else hideInputError(passwordField, passwordErrorSpan);
    }

    if (!dataIsValid) return;

    // Data is valid, carry on
    try {
        const json = JSON.stringify({ usernameOrEmail: usernameOrEmail, password: password });

        const response = await fetch(`${BACKEND_ROOT_URL}/login`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: json
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Login failed");
            return;
        }

        alert("Login successful!");

        window.location.href = "main.html";
    } catch (error) {
        alert("Unknown error occured!");
        console.log(`Network error: ${error}`);
    }
});

// Convenience functions
const displayInputError = (inputField, errorSpan, message) => {
    inputField.classList.add("auth-form_input_invalid");
    errorSpan.style.visibility = "visible";
    errorSpan.textContent = message;
}

const hideInputError = (inputField, errorSpan) => {
    inputField.classList.remove("auth-form_input_invalid");
    errorSpan.style.visibility = "hidden";
    errorSpan.textContent = "";
}


