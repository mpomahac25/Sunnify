import { createPostCard } from "../Reusable-HTML/components/postCard.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

const searchForm = document.getElementById("search-form");
const searchTermsField = document.getElementById("search-terms");
const searchLocationField = document.getElementById("search-location");

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const searchTerms = searchTermsField.value.trim();
    const searchLocation = searchLocationField.value.trim();

    window.location.href = `${BACKEND_ROOT_URL}/search.html?terms=${encodeURIComponent(searchTerms)}&location=${encodeURIComponent(searchLocation)}`;
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
