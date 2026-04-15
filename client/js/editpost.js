import { getSelectedLocation, getTypedLocationValue, markLocationInvalid, clearLocationInvalid, setTypedLocationValue } from "../Reusable-HTML/components/smartLocationDropdown.js";

(() => {
    const EDIT_POST_BACKEND_URL = "http://127.0.0.1:3000"

    document.addEventListener("DOMContentLoaded", async () => {
        const params = new URLSearchParams(window.location.search);
        const postId = parseInt(params.get("id"));

        if (Number.isNaN(postId)) {
            // If invalid, render a "missing post" state and stop.
            renderMissingEditPost("Invalid post id.");
            return;
        }

        try {
            const response = await fetch(`${EDIT_POST_BACKEND_URL}/posts/${postId}`, {
                method: "get",
            });

            const result = await response.json()

            if (!response.ok) {
                    alert(result.error || "Edit failed.");
                    return;
            }

            const form = document.querySelector("form");
            const titleField = document.getElementById("listing-title");
            const descriptionField = document.getElementById("listing-description");
            const priceField = document.getElementById("listing-price");
            const conditionField = document.getElementById("listing-condition");
            const categoryField = document.getElementById("listing-category");
            const cancelButton = document.querySelector('button[type="button"]');

            form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const title = titleField.value.trim();
            const description = descriptionField.value.trim();
            const price = priceField.value.trim();
            const condition = conditionField.value;
            const category = categoryField.value;

            const selectedLocation = getSelectedLocation();
            const typedLocation = getTypedLocationValue();
            const location = selectedLocation ? selectedLocation.name.trim() : typedLocation;

            if (selectedLocation && selectedLocation.type !== "city") {
                markLocationInvalid();
                alert("Location selection must be a city.");
                return;
            }

            const validationError = validateEditForm({
                title, description, price, condition, location, category
            });

            if (validationError) {
                if (!location) {
                    markLocationInvalid();
                }
                alert(validationError);
                return
            };

            clearLocationInvalid();

            const payload = {
                title, description, price: Number(price), condition, location, category, status: "available"
            };

            try {
                console.log(payload)

                const patchResponse = await fetch(`${EDIT_POST_BACKEND_URL}/posts/${postId}`,{
                  method: "PATCH",
                  headers : {
                    "Content-Type" : "application/json"
                  },
                  body: JSON.stringify(payload)
                });

                const patchResponseText = await patchResponse.text();
                console.log("PATCH raw response:", patchResponseText);

                let patchResult = {};

                if (patchResponseText) {
                    try {
                        patchResult = JSON.parse(patchResponseText);
                    } catch (error) {
                        console.error("PATCH response is not valid JSON:", error);
                    }
                }

                if (!patchResponse.ok) {
                    console.error(`Server error (${patchResponse.status}):`, patchResponseText);
                    alert(patchResult.error || "Edit failed.");
                    return;
                }

                window.location.href = `post.html?id=${patchResult.id}`;
            } catch (error) {
                console.error(error);
                alert("Network error while updating post.");
            }
        });

            fillEditForm(result);

            cancelButton?.addEventListener("click", () => {
                window.location.href = `post.html?id=${postId}`;
            });
        } catch (error) {
            console.error(error);
            renderMissingEditPost("Network error while loading post.");
        }
        
        
    });
    const fillEditForm = (post) => {
        setValue("listing-title", post.title);
        setValue("listing-description", post.description);
        setValue("listing-price", post.price);
        setValue("listing-condition", post.condition);
        setTypedLocationValue(post.location);
        setValue("listing-category", post.category);
    };

    const validateEditForm = ({ title, description, price, condition, location, category }) => {
        if (!title) {
            return "Title is required.";
        }

        if (!description) {
            return "Description is required.";
        }

        if (!price) {
            return "Price is required.";
        }

        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return "Price must be a valid non-negative number.";
        }

        if (!condition || condition === "Choose condition") {
            return "Please choose a condition.";
        }

        if (!location) {
            return "Please choose a location.";
        }

        if (!category || category === "Select category") {
            return "Please choose a category.";
        }

        return null;
    };

    const setValue = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = value ?? "";
        }
    };

    const renderMissingEditPost = (message) => {
        alert(message);
    };
})();
