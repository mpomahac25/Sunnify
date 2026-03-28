// client/Reusable-HTML/components/carouselLoader.js
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".carousel-container").forEach(container => {
        fetch("/Reusable-HTML/components/carousel.html") 
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
            });
    });
});