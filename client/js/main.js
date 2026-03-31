const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", async () => {
    const postsList = document.getElementById("posts-list")

    if(!postsList) {
        return;
    }

    try {

    } catch (error) {
        console.error(error);
        postsList.innerHTML =  `<p class="text-muted">Network error while loading posts </p>`
    }
})

const createPostCard = (post) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-6 col-lg-4";

    column.innerHTML = `
        <a href="post.html?id=${post.id}" class="text-decoration-none text-dark">
            <div class="img-container card h-100">
                <div class="carousel-container"></div>
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="text-muted">${post.location}</p>
                    <span class="fw-bold">${formatPrice(post.price)}</span>
                </div>
            </div>
        </a>
    `;
// price parcing
const formatPrice = (price) => {
    const parsedPrice = Number(price);
    // checks price
    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable"
    }

    return `€${parsedPrice} `
}
    return column;
};