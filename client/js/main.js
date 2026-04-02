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
            const postCard = createPostCard(post);
            postsList.appendChild(postCard);
        });
    } catch (error) {
        console.error(error);
        postsList.innerHTML = `<p class="text-muted">Network error while loading posts.</p>`;
    }
});

const createPostCard = (post) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-6 col-lg-4";

    column.innerHTML = `
        <a href="post.html?id=${post.id}" class="text-decoration-none text-dark">
            <div class="img-container card h-100">
                <div class="carousel-container"></div>
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="text-muted">${post.location ?? "Unknown location"}</p>
                    <span class="fw-bold">${formatPrice(post.price)}</span>
                </div>
            </div>
        </a>
    `;

    return column;
};
// price => number
const formatPrice = (price) => {
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable";
    }

    return `${parsedPrice} EUR`;
};