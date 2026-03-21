import { usernameValidators } from "./validation/username.js";
import { passwordValidators } from "./validation/password.js";
import { emailValidators } from "./validation/email.js";

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

const usernameField = document.getElementById("reg-username");
const usernameErrorSpan = document.getElementById("username-span");

const emailField = document.getElementById("email");
const emailErrorSpan = document.getElementById("email-span");

const passwordField = document.getElementById("reg-password");
const passwordErrorSpan = document.getElementById("reg-password-span");

const passwordCheckField = document.getElementById("confirm-password");
const passwordCheckErrorSpan = document.getElementById("confirm-password-span");

const registerButton = document.querySelector(".auth-form_submit");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameField.value.trim();
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    const passwordCheck = passwordCheckField.value.trim();

    // Input validation
    const validationResults = [
        validateUsername(username),
        validateEmail(email),
        validatePassword(password),
        validatePasswordMatch(password, passwordCheck)
    ];

    const dataIsValid = validationResults.every(Boolean);

    if (!dataIsValid) return;

    // Input is valid, send request to backend
    try {
        const json = JSON.stringify({ username: username, email: email, password: password });

        const response = await fetch(`${BACKEND_ROOT_URL}/register`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: json
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Registration failed");
            return;
        }

        alert("Registration successful!");

        window.location.href = "main.html";
    } catch (error) {
        alert("Unknown error occured!");
        console.log(`Network error: ${error}`);
    }
});

// Validation functions
const validateUsername = (username) => {
    /*
        Username validation: 
            Not empty
            3-30 characters long
            Has to start with letter
            Allowed alphanumeric characters and special characters ".-_"
            No multiple special characters in a row
    */
    // Not empty
    if (username === "") {
        const errorMessage = "Username cannot be empty!";
        displayInputError(usernameField, usernameErrorSpan, errorMessage);

        return false;
    }

    // Special rules checking
    let errors = [];

    usernameValidators.forEach(fn => {
        const err = fn(username);
        if (err) errors.push(`- ${err}`);
    });

    if (errors.length > 0) {
        const errorMessage = "Username is invalid! Please fix the following:\n" + errors.join("\n");
        displayInputError(usernameField, usernameErrorSpan, errorMessage);

        return false;
    }
    else {
        hideInputError(usernameField, usernameErrorSpan);

        return true;
    }
}

const validateEmail = (email) => {
    /*
        Email validation:
            Not empty
            Format like - someone@domain.com
    */
    // Not empty
    if (email === "") {
        const errorMessage = "Email cannot be empty!";
        displayInputError(emailField, emailErrorSpan, errorMessage);

        return false;
    }

    // Special rules checking
    let errors = [];

    emailValidators.forEach(fn => {
        const err = fn(email);
        if (err) errors.push(`- ${err}`);
    });

    if (errors.length > 0) {
        const errorMessage = "Email is invalid! Please fix the following:\n" + errors.join("\n");
        displayInputError(emailField, emailErrorSpan, errorMessage);

        return false;
    }
    else {
        hideInputError(emailField, emailErrorSpan);

        return true;
    }
}

const validatePassword = (password) => {
    /*
        Password validation:
            Not empty
            At least 8 characters long
            At least 1 capital letter
            At least 1 lowercase letter
            At least 1 number
            At least 1 special character
    */
    // Not empty
    if (password === "") {
        const errorMessage = "Password cannot be empty!";
        displayInputError(passwordField, passwordErrorSpan, errorMessage);

        return false;
    }

    // Special rules checking
    let errors = [];

    passwordValidators.forEach(fn => {
        const err = fn(password);
        if (err) errors.push(`- ${err}`);
    });

    if (errors.length > 0) {
        const errorMessage = "Password is invalid! Please fix the following:\n" + errors.join("\n");
        displayInputError(passwordField, passwordErrorSpan, errorMessage);

        return false;
    }
    else {
        hideInputError(passwordField, passwordErrorSpan);

        return true;
    }
}

const validatePasswordMatch = (password, passwordCheck) => {
    /*
        Repeat password validation:
            Not empty
            Must match password
    */
    // Not empty
    if (passwordCheck === "") {
        const errorMessage = "Password repeat cannot be empty!";
        displayInputError(passwordCheckField, passwordCheckErrorSpan, errorMessage);

        return false;
    }
    // Passwords match
    else if (password !== passwordCheck) {
        const errorMessage = "Passwords must match!";
        displayInputError(passwordCheckField, passwordCheckErrorSpan, errorMessage);

        return false;
    }
    else {
        hideInputError(passwordCheckField, passwordCheckErrorSpan);

        return true;
    }
}

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
