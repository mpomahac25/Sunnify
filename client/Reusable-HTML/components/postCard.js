const formatPostPrice = (price) => {
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable";
    }

    return `${parsedPrice} EUR`;
};

export const createPostCard = (post) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-6 col-lg-4";

    column.innerHTML = `
        <a href="post.html?id=${post.id}" class="text-decoration-none text-dark">
            <div class="img-container card h-100">
                <div class="carousel-container"></div>
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="text-muted">${post.location ?? "Unknown location"}</p>
                    <span class="fw-bold">${formatPostPrice(post.price)}</span>
                </div>
            </div>
        </a>
    `;

    return column;
};
