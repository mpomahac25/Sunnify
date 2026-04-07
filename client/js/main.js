import { createPostCard } from "../Reusable-HTML/components/postCard.js";
import { getSelectedLocation, getTypedLocationValue, markLocationInvalid, clearLocationInvalid } from "../Reusable-HTML/components/smartLocationDropdown.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

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

    window.location.href = `${BACKEND_ROOT_URL}/search?` +
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
        const response = await fetch(`${BACKEND_ROOT_URL}/posts`, {
            method: "get"
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
        result.forEach(post => {
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


