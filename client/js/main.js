import { createPostCard } from "../Reusable-HTML/components/postCard.js";
import {
    getSelectedLocation,
    getTypedLocationValue,
    markLocationInvalid,
    clearLocationInvalid,
} from "../Reusable-HTML/components/smartLocationDropdown.js";

const searchForm = document.getElementById("search-form");
const searchTermsField = document.getElementById("search-terms");

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const searchTerms = searchTermsField.value.trim();
    const searchLocationTyped = getTypedLocationValue();
    const selectedLocation = getSelectedLocation();

    if (searchLocationTyped !== "" && !selectedLocation) {
        markLocationInvalid();
        return;
    }

    clearLocationInvalid();

    const searchLocation = selectedLocation ? selectedLocation.name : "";
    const searchLocationId = selectedLocation ? selectedLocation.id : "";
    const searchLocationType = selectedLocation ? selectedLocation.type : "";

    window.location.href =
        `/search?` +
        `terms=${encodeURIComponent(searchTerms)}&` +
        `location=${encodeURIComponent(searchLocation)}&` +
        `type=${encodeURIComponent(searchLocationType)}&` +
        `id=${encodeURIComponent(searchLocationId)}`;
});

document.addEventListener("DOMContentLoaded", async () => {
    const postsList = document.getElementById("posts-list");

    //checks if posts-section is ok
    if (!postsList) {
        return;
    }

    try {
        const response = await fetch(`/posts`, {
            method: "get",
        });

        const result = await response.json();

        // validation section
        if (!response.ok) {
            postsList.innerHTML = `<p class="text-muted">Could not load posts.</p>`;
            return;
        }

        if (result.length === 0) {
            postsList.innerHTML = `<p class="text-muted">No posts available.</p>`;
            return;
        }

        // cleans all example posts
        postsList.innerHTML = "";

        // adds data for each post
        result.forEach((post) => {
            postsList.appendChild(createPostCard(post));
        });

        if (typeof window.loadCarousels === "function") {
            await window.loadCarousels(postsList);
        }
    } catch (error) {
        console.error(error);
        postsList.innerHTML = `<p class="text-muted">Network error while loading posts.</p>`;
    }
});

// price => number
const formatPrice = (price) => {
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable";
    }

    return `${parsedPrice} EUR`;
};

// Categories
const categories = [];

const categoryIconMap = {
    Uncategorized: "bi-question-circle",
    Instruments: "bi-music-note",
    Hobbies: "bi-puzzle",
    Clothes: "bi-person-standing-dress",
    Electronics: "bi-phone",
    Home: "bi-house",
    Sports: "bi-person-arms-up",
    Kids: "bi-emoji-smile",
    Vehicles: "bi-car-front",
    Pets: "bi bi-android",
    Beauty: "bi-heart",
    "Real Estate": "bi-building",
    Jobs: "bi-briefcase",
    Services: "bi-tools",
    "Free Stuff": "bi-gift",
};

function renderCategories(categories) {
    const container = document.querySelector(".categories-slider");
    if (!container) return;
    container.innerHTML = "";

    categories.forEach((cat) => {
        const name = cat.name || cat.category;
        const icon = categoryIconMap[name] || "bi-question-circle";

        container.innerHTML += `
            <div class="d-flex flex-column align-items-center px-2 category-link" 
                 style="min-width:90px; cursor:pointer;" 
                 data-category="${encodeURIComponent(name)}">
                <i class="bi ${icon} fs-2"></i>
                <div class="small mt-1 text-center text-nowrap">${name}</div>
            </div>
        `;
    });

    // Add the click logic
    container.querySelectorAll(".category-link").forEach((el) => {
        el.addEventListener("click", function () {
            const category = this.getAttribute("data-category");
            window.location.href = `/search?category=${category}`;
        });
    });

    // DELETE the extra "container.innerHTML +=" block that was at the end here!
}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/categories", { method: "GET" });
        const categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error("Failed to load categories:", error);
    }
});
