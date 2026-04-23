// client/Reusable-HTML/components/carouselLoader.js
(() => {
    let carouselTemplatePromise = null;
    let carouselIdCounter = 0;

    const getImagesFromContainer = (container) => {
        try {
            const images = JSON.parse(container.dataset.images || "[]");
            return Array.isArray(images) ? images : [];
        } catch (error) {
            console.error("Failed to parse carousel images.", error);
            return [];
        }
    };

    const buildCarouselItemsMarkup = (images) => {
        if (!Array.isArray(images) || images.length === 0) {
            return `
                <div class="carousel-item active">
                    <div class="img-holder ratio ratio-1x1 w-100"></div>
                </div>
            `;
        }

        return images
            .map(
                (image, index) => `
            <div class="carousel-item ${index === 0 ? "active" : ""}">
                <div class="ratio ratio-1x1 w-100">
                    <img
                        src="${image.image_url}"
                        class="w-100 h-100 object-fit-cover"
                        alt="Post image"
                        loading="lazy"
                    >
                </div>
            </div>
        `,
            )
            .join("");
    };

    const populateCarouselContent = (container) => {
        const carouselInner = container.querySelector(".carousel-inner");

        if (!carouselInner) {
            return;
        }

        const images = getImagesFromContainer(container);
        carouselInner.innerHTML = buildCarouselItemsMarkup(images);

        const controls = container.querySelectorAll(
            ".carousel-control-prev, .carousel-control-next",
        );

        controls.forEach((control) => {
            control.style.display = images.length > 1 ? "" : "none";
        });

        // Initialize Bootstrap carousel
        const carouselElement = container.querySelector(".carousel");
        if (carouselElement) {
            new bootstrap.Carousel(carouselElement);
        }
    };

    const getCarouselTemplate = async () => {
        if (!carouselTemplatePromise) {
            carouselTemplatePromise = fetch("/Reusable-HTML/components/carousel.html").then(
                (response) => {
                    if (!response.ok) {
                        throw new Error("Carousel template could not be loaded.");
                    }

                    return response.text();
                },
            );
        }

        return carouselTemplatePromise;
    };

    const assignUniqueCarouselId = (container) => {
        const carouselElement = container.querySelector(".carousel");

        if (!carouselElement) {
            return;
        }

        carouselIdCounter += 1;

        const carouselId = `post-carousel-${carouselIdCounter}`;
        carouselElement.id = carouselId;

        container.querySelectorAll("[data-bs-target]").forEach((control) => {
            control.setAttribute("data-bs-target", `#${carouselId}`);
        });
    };

    const initializeCarouselInstance = (container) => {
        const carouselElement = container.querySelector(".carousel");

        if (!carouselElement || !window.bootstrap?.Carousel) {
            return;
        }

        window.bootstrap.Carousel.getOrCreateInstance(carouselElement);
    };

    const loadCarousels = async (root = document) => {
        const containers = root.querySelectorAll(".carousel-container");

        if (containers.length === 0) {
            return;
        }

        try {
            const template = await getCarouselTemplate();

            containers.forEach((container) => {
                if (container.dataset.carouselReady === "true") {
                    return;
                }

                container.innerHTML = template;
                assignUniqueCarouselId(container); // Set ID first
                populateCarouselContent(container); // Initialize Bootstrap with correct ID
                container.dataset.carouselReady = "true";
            });
        } catch (error) {
            console.error(error);
        }
    };

    window.loadCarousels = loadCarousels;

    document.addEventListener("DOMContentLoaded", () => {
        loadCarousels();
    });
})();
