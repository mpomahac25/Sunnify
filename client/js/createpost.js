import { getSelectedLocation, getTypedLocationValue, markLocationInvalid, clearLocationInvalid } from "../Reusable-HTML/components/smartLocationDropdown.js";

(() => {

    document.addEventListener("DOMContentLoaded", async () => {
        // gets elems by ids
        const form = document.querySelector(".createpost-form-card form");
        const titleField = document.getElementById("listing-title");
        const descriptionField = document.getElementById("listing-description");
        const priceField = document.getElementById("listing-price");
        const conditionField = document.getElementById("listing-condition");
        const categoryField = document.getElementById("listing-category");

        if (!form) {
            return;
        }

        try {
            //checks if user logged in
            const sessionResponse = await fetch(`/check-session`, {
                method: "get",
                credentials: "include"
            });

            const sessionResult = await sessionResponse.json();

            if (!sessionResult.loggedIn) {
                window.location.href = "login.html";
                return;
            }
        } catch (error) {
            console.error(error);
            alert("Could not verify session.");
            return;
        }

        // when publish btn clicked
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Fetch location selection
            const selectedLocation = getSelectedLocation();
            if (!selectedLocation || selectedLocation.type !== "city") {
                alert("Location selection must be a city, it cannot be a country or region");
                return;
            }

            // takes values
            const title = titleField.value.trim();
            const description = descriptionField.value.trim();
            const price = priceField.value.trim();
            const condition = conditionField.value;
            const location = selectedLocation.name.trim();
            const cityId = selectedLocation.id;
            const category = categoryField.value;

            //validation
            const validationError = validateForm({
                title,
                description,
                price,
                condition,
                location,
                cityId,
                category
            });

            if (validationError) {
                alert(validationError);
                return;
            }

            // will be sent to backend
            const payload = {
                title,
                description,
                price: Number(price),
                condition,
                location,
                category,
                status: "available"
            };

            try {
                // sends to /posts
                const response = await fetch(`/posts`, {
                    method: "post",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                //if not succesful
                if (!response.ok) {
                    alert(result.error || "Post creation failed.");
                    return;
                }

                // succesful response
                window.location.href = `post.html?id=${result.id}`;
            } catch (error) {
                console.error(error);
                alert("Network error while creating post.");
            }
        });
    });
    
    // validation during user creating post
    const validateForm = ({ title, description, price, condition, location, cityId, category }) => {
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

        if (!location || !cityId) {
            return "Please choose a city from the list.";
        }

        if (!category || category === "Select category") {
            return "Please choose a category.";
        }
        // if no problems - returns null
        return null;
    };
})();
