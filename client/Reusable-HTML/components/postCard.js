const formatPostPrice = (price) => {
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable";
    }

    return `${parsedPrice.toLocaleString("en-US")} EUR`;
};

export const createPostCard = (post, options = {}) => {
    const {
        columnClassName = "col-6 col-md-6 col-lg-4",
        showFavoriteButton = true
    } = options;

    const column = document.createElement("div");
    column.className = columnClassName;

    column.innerHTML = showFavoriteButton
        ? `
            <a href="post.html?id=${post.id}" class="text-decoration-none text-dark">
                <div class="img-container card h-100">
                    <div class="carousel-container"></div>
                    <div class="card-body">
                        <h5 class="card-title">${post.title}</h5>
                        <p class="text-muted">${post.location ?? "Unknown location"}</p>
                        <span class="fw-bold">${formatPostPrice(post.price)}</span>
                    </div>
                    <div class="card-footer d-flex justify-content-end">
                        <button class="favorite-btn btn btn-outline-danger btn-sm" type="button">
                            <i class="bi bi-heart fs-4"></i>
                        </button>
                    </div>
                </div>
            </a>
        `
        : `
            <a href="post.html?id=${post.id}" class="text-decoration-none text-dark">
                <div class="img-container card h-100">
                    <div class="carousel-container"></div>
                    <div class="card-body">
                        <h3 class="h6 card-title mb-1">${post.title}</h3>
                        <p class="text-muted mb-2">${post.location ?? "Unknown location"}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold">${formatPostPrice(post.price)}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;

    return column;
};
