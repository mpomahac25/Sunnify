import { getSelectedLocation, getTypedLocationValue, markLocationInvalid, clearLocationInvalid } from "../Reusable-HTML/components/smartLocationDropdown.js";
import { getSelectedCondition, clearSelectedCondition, markConditionInvalid, clearConditionInvalid } from "../Reusable-HTML/components/conditionDropdown.js";
import { getSelectedCategory, clearSelectedCategory, markCategoryInvalid, clearCategoryInvalid } from "../Reusable-HTML/components/smartCategoryDropdown.js";

(() => {

    document.addEventListener("DOMContentLoaded", async () => {
        // gets elems by ids
        const form = document.querySelector(".createpost-form-card form");
        const titleField = document.getElementById("listing-title");
        const descriptionField = document.getElementById("listing-description");
        const priceField = document.getElementById("listing-price");
        const conditionField = document.getElementById("listing-condition");
        const categoryField = document.getElementById("listing-category");
        const imagesField = document.getElementById("listing-images");

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

            // if not logged in redirects to login page
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
            // takes images from field
            const files = Array.from(imagesField.files || []);

            if (files.length > 10) {
                alert("Maximum 10 images allowed");
                return;
            }

            if (files.length === 0) {
                alert("Please select at least 1 image")
                return;
            }
            
            const uploadedImageUrls = [];

            // loads all images
            for (const file of files) {
                const formData = new FormData();
                formData.append("image", file);

                const uploadResponse = await fetch("/upload-image", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                })

                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    alert(uploadResult.error || "Image upload failed");
                    return;
                }

                uploadedImageUrls.push(uploadResult.imageUrl);
            }

            // Fetch location selection
            const selectedLocation = getSelectedLocation();
            if (!selectedLocation || selectedLocation.type !== "city") {
                alert("Location selection must be a city, it cannot be a country or region");
                return;
            }

            // Fetch category selection
            const selectedCategory = getSelectedCategory();
            if (!getSelectedCategory()) {
                markCategoryInvalid();
                return;
            }
            clearCategoryInvalid();

            // Fetch condition selection
            const selectedCondition = getSelectedCondition();
            if (!getSelectedCondition()) {
                markConditionInvalid();
                return;
            }
            clearConditionInvalid();

            // takes values
            const title = titleField.value.trim();
            const description = descriptionField.value.trim();
            const price = priceField.value.trim();
            const location = selectedLocation.name.trim();
            const cityId = selectedLocation.id;
            const categoryId = selectedCategory.type === "subcategory" ? selectedCategory.categoryId : selectedCategory.id;
            const subcategoryId = selectedCategory.type === "subcategory" ? selectedCategory.id : 0;
            const condition = selectedCondition;

            //validation
            const validationError = validateForm({
                title,
                description,
                price,
                condition,
                location,
                cityId,
                category: categoryId
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
                categoryId,
                subcategoryId,
                status: "available",
                images: uploadedImageUrls
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
