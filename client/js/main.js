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
