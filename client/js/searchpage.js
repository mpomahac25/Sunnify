import { getSelectedCategory, getTypedCategoryValue, clearSelectedCategory, markCategoryInvalid, clearCategoryInvalid } from "../Reusable-HTML/components/smartCategoryDropdown.js";
import { getSelectedLocation, getTypedLocationValue, clearSelectedLocation, markLocationInvalid, clearLocationInvalid } from "../Reusable-HTML/components/smartLocationDropdown.js";
import { getSelectedCondition, clearSelectedCondition } from "../Reusable-HTML/components/conditionDropdown.js";
import { createPostCard } from "../Reusable-HTML/components/postCard.js";

// Const config vars
const BACKEND_ROOT_URL = "http://127.0.0.1:3000";
const PRICE_GROUPS = [
    10, 25, 50, 100, 250, 500, 1000, 2500, 5000,
    10000, 25000, 50000, 100000, 250000, 500000, 1000000
];
const PRICE_SLIDER_STEPS = 100;

// Result grid
const resultsGrid = document.getElementById("resultsGrid");
const resultsCount = document.getElementById("resultsCount");

// Filtering
const applyBtn = document.getElementById('apply-filters-btn');
const resetBtn = document.getElementById('reset-filters-btn');
const filtersCollapse = document.getElementById('filtersCollapse');

// Sorting
const sortSelect = document.getElementById('sort-select'); // TODO: Add element (if missing) and functionalities

// Price slider
const minSlider = document.getElementById("price-min");
const maxSlider = document.getElementById("price-max");
const minLabel = document.getElementById("price-min-label");
const maxLabel = document.getElementById("price-max-label");
const rangeFill = document.getElementById("slider-range-fill");

// Search object and results
let searchObject = createSearchObject();
let allResults = [];
let filteredResultsWithoutPrice = [];
let lastNonPriceFilterKey = "";

// Search object stuff
function createSearchObject() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
        searchTermsRaw: urlParams.get("terms") || "",
        locationName: urlParams.get("location") || "",
        locationType: urlParams.get("type") || "",
        locationId: urlParams.get("id") || "",
        sortType: "relevance",
        filters: {
            categoryId: "",
            subcategoryId: "",
            conditionId: "",
            priceMin: "",
            priceMax: ""
        }
    };
}

const getPriceFilterValues = () => {
    if (!minSlider || !maxSlider) return;

    return {
        priceMin: minSlider ? Number(minSlider.value) : 0,
        priceMax: maxSlider ? Number(maxSlider.value) : 0
    };
};

const getLocationFilterValues = () => {
    const locationChoice = getSelectedLocation();

    if (!locationChoice) {
        return {
            locationId: "",
            locationType: "",
            locationName: ""
        };
    }

    return {
        locationId: String(locationChoice.id),
        locationType: locationChoice.type,
        locationName: locationChoice.name
    };
};

const getCategoryFilterValues = () => {
    let categoryObject = {
        categoryId: "",
        subcategoryId: ""
    };
    const categoryChoice = getSelectedCategory();

    if (categoryChoice) {
        categoryObject.categoryId = String(categoryChoice.type === "category" ? categoryChoice.id : categoryChoice.categoryId);
        categoryObject.subcategoryId = String(categoryChoice.type === "subcategory" ? categoryChoice.id : "");
    }

    return categoryObject;
};

const updateSearchObjectFilters = () => {
    const priceValues = getPriceFilterValues();
    const categoryValues = getCategoryFilterValues();
    const locationValues = getLocationFilterValues();

    searchObject.locationName = locationValues.locationName;
    searchObject.locationType = locationValues.locationType;
    searchObject.locationId = locationValues.locationId;

    searchObject.filters.categoryId = categoryValues.categoryId;
    searchObject.filters.subcategoryId = categoryValues.subcategoryId;
    searchObject.filters.conditionId = getSelectedCondition();
    searchObject.filters.priceMin = priceValues.priceMin;
    searchObject.filters.priceMax = priceValues.priceMax;
};

const buildNonPriceFilterKey = () => {
    return JSON.stringify({
        locationName: searchObject.locationName,
        locationType: searchObject.locationType,
        locationId: searchObject.locationId,
        categoryId: searchObject.filters.categoryId,
        subcategoryId: searchObject.filters.subcategoryId,
        conditionId: searchObject.filters.conditionId
    });
};

// Backend communication
const fetchSearchResults = async (requestObject) => {
    const response = await fetch(`${BACKEND_ROOT_URL}/search-results`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestObject)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch search results with status ${response.status}`);
    }

    return response.json();
};

// Filter functions
const filterResultsNoPriceLimit = (results) => {
    if (!Array.isArray(results)) return [];

    const {
        categoryId,
        subcategoryId,
        conditionId
    } = searchObject.filters;

    const {
        locationName,
        locationType,
        locationId
    } = getLocationFilterValues();

    return results.filter(result => {
        // Location filter
        if (locationType !== "") {
            if (locationType === "city") {
                if (String(result.city_id) !== String(locationId)) {
                    return false;
                }
            }
            else if (locationType === "region") {
                if (String(result.region_name) !== String(locationName)) {
                    return false;
                }
            }
            else if (locationType === "country") {
                if (String(result.country_name) !== String(locationName)) {
                    return false;
                }
            }
        }

        // Category filter
        if (subcategoryId !== "") {
            if (String(result.subcategory_id) !== String(subcategoryId)) {
                return false;
            }
        } else if (categoryId !== "") {
            if (String(result.category_id) !== String(categoryId)) {
                return false;
            }
        }

        // Condition filter
        if (conditionId !== "" && String(result.condition_id) !== String(conditionId)) {
            return false;
        }

        return true;
    });
};

const applyPriceFiltering = (results) => {
    if (!Array.isArray(results)) return [];

    const { priceMin, priceMax } = searchObject.filters;

    const min = priceMin === "" ? 0 : Number(priceMin);
    const max = priceMax === "" ? Infinity : Number(priceMax);

    return results.filter(result => {
        const price = Number(result.price);

        if (Number.isNaN(price)) {
            return false;
        }

        return price >= min && price <= max;
    });
};

const filterResults = () => {
    updateSearchObjectFilters();

    const nonPriceFilterKey = buildNonPriceFilterKey();

    if (nonPriceFilterKey !== lastNonPriceFilterKey) {
        filteredResultsWithoutPrice = filterResultsNoPriceLimit(allResults);
        lastNonPriceFilterKey = nonPriceFilterKey;

        refreshPriceSliderFromCandidateResults(filteredResultsWithoutPrice, false);

        const priceValues = getPriceFilterValues();
        searchObject.filters.priceMin = priceValues ? priceValues.priceMin : "";
        searchObject.filters.priceMax = priceValues ? priceValues.priceMax : "";
    }

    const filteredResults = applyPriceFiltering(filteredResultsWithoutPrice);
    renderResults(filteredResults);

    return filteredResults;
};

// Rendering functions
const updateSearchResultsCount = () => {
    const count = resultsGrid ? resultsGrid.querySelectorAll(".result-card").length : 0;
    if (resultsCount) {
        const resultOrResults = (count === 1 || (count % 10 === 1 && count % 100 !== 11)) ? "result" : "results";
        resultsCount.textContent = `${count} ${resultOrResults}`;
    }
};

const buildPostLocationText = (post) => {
    if (post.city_name) {
        return post.city_name;
    }

    if (post.region_name) {
        return post.region_name;
    }

    if (post.country_name) {
        return post.country_name;
    }

    return "Unknown location";
};

const renderResults = async (results) => {
    console.log("Render results:", results);

    // Check if resultsGrid is found, and clear it
    if (!resultsGrid) return;
    resultsGrid.innerHTML = "";

    // No results found
    if (!Array.isArray(results) || results.length === 0) {
        resultsGrid.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-0">No results found.</p>
            </div>
        `;
        updateSearchResultsCount();
        return;
    }

    results.forEach((result) => {
        const postCardData = {
            id: result.id,
            title: result.title,
            price: result.price,
            location: buildPostLocationText(result)
        };

        const cardColumn = createPostCard(postCardData, {
            columnClassName: "col-12 col-sm-6 col-lg-4",
            showFavoriteButton: true
        });

        cardColumn.classList.add("result-card");
        resultsGrid.appendChild(cardColumn);
    });

    updateSearchResultsCount();

    if (typeof window.loadCarousels === "function") {
        await window.loadCarousels(resultsGrid);
    }
};

// Price slider helpers and functions
const initializePriceSlider = () => {
    if (!minSlider || !maxSlider) return;

    minSlider.addEventListener("input", updatePriceSliderUI);
    maxSlider.addEventListener("input", updatePriceSliderUI);

    updatePriceSliderUI();
};

const updatePriceSliderUI = () => {
    // Probably not needed, but just in case: validate that all parts are present
    if (!minSlider || !maxSlider || !minLabel || !maxLabel || !rangeFill) return;

    let minValue = Number(minSlider.value);
    let maxValue = Number(maxSlider.value);
    const min = Number(minSlider.min);
    const max = Number(minSlider.max);
    const step = Number(minSlider.step);

    // Validate that everything is a number
    if (Number.isNaN(minValue) || Number.isNaN(maxValue) || Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(step)) return;

    if (minValue > maxValue - step) {
        minValue = maxValue - step;
        minSlider.value = minValue;
    }

    if (maxValue < minValue + step) {
        maxValue = minValue + step;
        maxSlider.value = maxValue;
    }

    minLabel.textContent = minValue;
    maxLabel.textContent = maxValue;

    const leftPercent = ((minValue - min) / (max - min)) * 100;
    const rightPercent = ((maxValue - min) / (max - min)) * 100;

    rangeFill.style.left = leftPercent + "%";
    rangeFill.style.width = (rightPercent - leftPercent) + "%";
};

const setPriceSliderRange = (maxValue, step, preserveCurrentValues = true) => {
    if (!minSlider || !maxSlider) return;

    const safeMax = Math.max(1, Number(maxValue) || 1);
    const safeStep = Math.round(safeMax / PRICE_SLIDER_STEPS);

    const currentMin = preserveCurrentValues ? Number(minSlider.value) : 0;
    const currentMax = preserveCurrentValues ? Number(maxSlider.value) : safeMax;

    minSlider.min = "0";
    maxSlider.min = "0";

    minSlider.max = String(safeMax);
    maxSlider.max = String(safeMax);

    minSlider.step = String(safeStep);
    maxSlider.step = String(safeStep);

    let nextMin = Math.max(0, Math.min(currentMin, safeMax));
    let nextMax = Math.max(0, Math.min(currentMax, safeMax));

    if (nextMax <= nextMin) {
        if (nextMin + safeStep <= safeMax) {
            nextMax = nextMin + safeStep;
        } else {
            nextMin = Math.max(0, safeMax - safeStep);
            nextMax = safeMax;
        }
    }

    minSlider.value = String(nextMin);
    maxSlider.value = String(nextMax);

    updatePriceSliderUI();
};

const determinePriceSliderRangeAndStep = (results) => {
    if (!Array.isArray(results)) return null;

    if (results.length === 0) return null;

    const prices = results
        .map(result => Number(result.price))
        .filter(price => !Number.isNaN(price) && price >= 0);

    const maxPrice = Math.max(...prices);
    const sliderMax = determinePriceGroup(maxPrice);
    const step = Math.round(sliderMax / PRICE_SLIDER_STEPS);

    return {
        sliderMax,
        step
    };
};

const determinePriceGroup = (maxPrice) => {
    let priceGroup = PRICE_GROUPS.find(groupMax => maxPrice <= groupMax);

    if (!priceGroup) {
        // Use next multiple of 1,000,000 if highest price is above largest group
        priceGroup = Math.ceil(maxPrice / 1000000) * 1000000
    }

    return priceGroup;
};

const refreshPriceSliderFromCandidateResults = (results, preserveCurrentValues = false) => {
    const rangeConfig = determinePriceSliderRangeAndStep(results);

    if (!rangeConfig) {
        setPriceSliderRange(10, 1, false);
        resetPriceSlider();
        return;
    }

    setPriceSliderRange(rangeConfig.sliderMax, rangeConfig.step, preserveCurrentValues);
};

const resetPriceSlider = () => {
    if (!minSlider || !maxSlider) return;

    minSlider.value = "0";
    maxSlider.value = maxSlider.max;

    updatePriceSliderUI();
}

// Event listeners
if (applyBtn) {
    applyBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();

        // Validate smart dropdowns
        if (!validateLocationFilter() || !validateCategoryFilter()) return;

        // Perform filtering
        filterResults();

        // Close filters on mobile (bootstrap collapse)
        if (filtersCollapse && window.bootstrap) {
            const bsCollapse = bootstrap.Collapse.getInstance(filtersCollapse) || new bootstrap.Collapse(filtersCollapse, { toggle: false });
            if (window.innerWidth < 992) bsCollapse.hide();
        }
    });
}

if (resetBtn) {
    resetBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();

        // Clear filters
        clearSelectedLocation();
        clearSelectedCategory();
        clearSelectedCondition();

        // Reset search object filters
        searchObject.filters.categoryId = "";
        searchObject.filters.subcategoryId = "";
        searchObject.filters.conditionId = "";
        searchObject.filters.priceMin = "";
        searchObject.filters.priceMax = "";

        // No price filter stuff
        lastNonPriceFilterKey = "";
        filteredResultsWithoutPrice = allResults;

        // Reset price slider
        refreshPriceSliderFromCandidateResults(allResults, false);
        resetPriceSlider();

        // Render results after resetting filters
        renderResults(allResults);
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', function () {
        console.log('Sort:', sortSelect.value);
    });
}

document.querySelectorAll(".dropdown-menu .dropdown-item").forEach(item => {
    item.addEventListener("click", (event) => {
        event.preventDefault();

        if (sortDropdownButton) {
            sortDropdownButton.textContent = item.textContent;
        }

        document.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        searchObject.sortType = item.dataset.value || "relevance";
        console.log("Sort selected:", searchObject.sortType);
    });
});

// Validation methods
const validateLocationFilter = () => {
    const typedLocation = getTypedLocationValue();
    const selectedLocation = getSelectedLocation();

    if (typedLocation !== "" && !selectedLocation) {
        markLocationInvalid();
        return false;
    }

    clearLocationInvalid();
    return true;
};

const validateCategoryFilter = () => {
    const typedCategory = getTypedCategoryValue();
    const selectedCategory = getSelectedCategory();

    if (typedCategory !== "" && !selectedCategory) {
        markCategoryInvalid();
        return false;
    }

    clearCategoryInvalid();
    return true;
};

// Initialize data of webpage
document.addEventListener("DOMContentLoaded", async () => {
    // Initial results for placeholder, to be removed later
    updateSearchResultsCount();

    // Initialize price slider
    initializePriceSlider();

    // Fetch initial filtered data based on object
    try {
        const responseData = await fetchSearchResults(searchObject);

        console.log("Search response:", responseData);

        allResults = Array.isArray(responseData.posts) ? responseData.posts : [];

        filteredResultsWithoutPrice = allResults;
        refreshPriceSliderFromCandidateResults(filteredResultsWithoutPrice, false);
        updateSearchObjectFilters();

        const finalResults = applyPriceFiltering(filteredResultsWithoutPrice);
        renderResults(finalResults);
    } catch (error) {
        console.error("Initial search failed:", error);
    }
});


