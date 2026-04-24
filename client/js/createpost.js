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

        // handle image preview display
        const imagePreviewContainer = document.getElementById("image-preview");
        let selectedFiles = [];
        
        // function to render all preview images
        const renderPreviews = () => {
            imagePreviewContainer.innerHTML = "";

            selectedFiles.forEach((file, index) => {
                // reader for every img
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const imgWrapper = document.createElement("div");
                    imgWrapper.className = "image-preview-item";
                    
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.className = "image-preview-img";
                    
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                    removeBtn.className = "btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle p-0 image-remove-btn";
                    
                    removeBtn.addEventListener("click", (e) => {
                        e.preventDefault();
                        selectedFiles.splice(index, 1);
                        imagesField.value = "";
                        renderPreviews();
                    });
                    
                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(removeBtn);
                    imagePreviewContainer.appendChild(imgWrapper);
                };
                
                reader.readAsDataURL(file);
            });
        };
        
        imagesField.addEventListener("change", (event) => {
            const newFiles = Array.from(event.target.files || []);
            
            // add new files to existing selection (combines two arrays into a single one)
            selectedFiles = [...selectedFiles, ...newFiles];
            
            if (selectedFiles.length > 10) {
                alert("Maximum 10 images allowed");
                selectedFiles = selectedFiles.slice(0, 10);
            }
            
            renderPreviews();
            imagesField.value = "";
        });

        // when publish btn clicked
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            // takes images from accumulated selection, not from field
            const files = selectedFiles;

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
                clearCategoryInvalid();
            }

            // Fetch condition selection
            const selectedCondition = getSelectedCondition();
            if (!getSelectedCondition()) {
                clearConditionInvalid();
            }

            // takes values
            const title = titleField.value.trim();
            const description = descriptionField.value.trim();
            const price = priceField.value.trim();
            const location = selectedLocation.name.trim();
            const cityId = selectedLocation.id;
            const categoryId = selectedCategory ? (selectedCategory.type === "subcategory" ? selectedCategory.categoryId : selectedCategory.id) : 0;
            const subcategoryId = selectedCategory ? (selectedCategory.type === "subcategory" ? selectedCategory.id : 0) : 0;
            const condition = selectedCondition || 0

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
    const validateForm = ({ title, description, price, location, cityId }) => {
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

        if (!location || !cityId) {
            return "Please choose a city from the list.";
        }
        // if no problems - returns null
        return null;
    };
})();
