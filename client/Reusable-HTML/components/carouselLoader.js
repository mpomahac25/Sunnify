// client/Reusable-HTML/components/carouselLoader.js
(() => {
    let carouselTemplatePromise = null;
    let carouselIdCounter = 0;

    const getCarouselTemplate = async () => {
        if (!carouselTemplatePromise) {
            carouselTemplatePromise = fetch("/Reusable-HTML/components/carousel.html")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Carousel template could not be loaded.");
                    }

                    return response.text();
                });
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

        container.querySelectorAll("[data-bs-target]").forEach(control => {
            control.setAttribute("data-bs-target", `#${carouselId}`);
        });
    };

    const loadCarousels = async (root = document) => {
        const containers = root.querySelectorAll(".carousel-container");

        if (containers.length === 0) {
            return;
        }

        try {
            const template = await getCarouselTemplate();

            containers.forEach(container => {
                if (container.dataset.carouselReady === "true") {
                    return;
                }

                container.innerHTML = template;
                container.dataset.carouselReady = "true";
                assignUniqueCarouselId(container);
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
