const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

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
    const dataIsValid =
        validateUsername(username) &&
        validateEmail(email) &&
        validatePassword(password) &&
        validatePasswordMatch(password, passwordCheck);

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

// Username validation functions
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
    const validationFunctions = [
        checkUsernameLength,
        checkUsernameStart,
        checkUsernameValidCharacters,
        checkUsernameRepeatingSpecialCharacters
    ];

    validationFunctions.forEach(fn => {
        const err = fn(username);
        if (err) errors.push(`-${err}`);
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

const checkUsernameLength = (username) => {
    const usernameLength = { min: 3, max: 30 };

    if (username.length < usernameLength.min) return `Must be at least ${usernameLength.min} characters long`;
    if (username.length > usernameLength.max) return `Must be less than ${usernameLength.max} characters long`;
    return null;
}

const checkUsernameStart = (username) => {
    const startRegex = /^[a-zA-Z]/;

    if (!startRegex.test(username)) return "Must begin with a letter";
    return null;
}

const checkUsernameValidCharacters = (username) => {
    const allowedSpecialChars = "._-";
    const charCheckRegex = RegExp(`^[a-zA-Z0-9${allowedSpecialChars}]+$`);

    if (!charCheckRegex.test(username)) return `Allowed characters are letters, numbers, and ${allowedSpecialChars} special characters`;
    return null;
}

const checkUsernameRepeatingSpecialCharacters = (username) => {
    const allowedSpecialChars = "._-";
    const specCharCheckRegex = RegExp(`[${allowedSpecialChars}]{2,}`);

    if (specCharCheckRegex.test(username)) return "Cannot have more than 1 special character in a row";
    return null;
}

// Email validation functions
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
    const validationFunctions = [
        checkEmailFormat
    ];

    validationFunctions.forEach(fn => {
        const err = fn(email);
        if (err) errors.push(`-${err}`);
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

const checkEmailFormat = (email) => {
    const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValidationRegex.test(email)) return "Invalid email format, should be like someone@example.com";
    return null;
}

// Password validation functions
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
    const validationFunctions = [
        checkPasswordLength,
        checkPasswordCapitalLetter,
        checkPasswordLowercaseLetter,
        checkPasswordNumber,
        checkPasswordSpecialCharacter
    ];

    validationFunctions.forEach(fn => {
        const err = fn(password);
        if (err) errors.push(`-${err}`);
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

const checkPasswordLength = (password) => {
    const minLength = 8;

    if (password.length < minLength) return `Must be at least ${minLength} characters long`;
    return null;
}

const checkPasswordCapitalLetter = (password) => {
    const capitalLetterRegex = /[A-Z]+/;

    if (!capitalLetterRegex.test(password)) return "Must contain a capital letter";
    return null;
}

const checkPasswordLowercaseLetter = (password) => {
    const lowercaseLetterRegex = /[a-z]+/;

    if (!lowercaseLetterRegex.test(password)) return "Must contain a lowercase letter";
    return null;
}

const checkPasswordNumber = (password) => {
    const numberRegex = /[0-9]+/;

    if (!numberRegex.test(password)) return "Must contain a number";
    return null;
}

const checkPasswordSpecialCharacter = (password) => {
    const allowedSpecialCharacters = "-._+*!?$€&#";
    const specialCharCheckRegex = RegExp(`[${allowedSpecialCharacters}]+`);

    if (!specialCharCheckRegex.test(password)) return `Must contain at least 1 special character (${allowedSpecialCharacters})`;
    return null;
}

// Password repeat validation
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
