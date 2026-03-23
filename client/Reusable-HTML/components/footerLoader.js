document.addEventListener("DOMContentLoaded", () => {
    fetch("/Reusable-HTML/components/footer.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("footer-container").innerHTML = html;
        });
});