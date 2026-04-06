import { createPostCard } from "../Reusable-HTML/components/postCard.js";

import { Locations } from "./Classes/locations.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

const searchForm = document.getElementById("search-form");
const searchTermsField = document.getElementById("search-terms");
const searchLocationField = document.getElementById("search-location");
const searchLocationDropdown = document.getElementById("location-dropdown");

let locationsFlatArray = [];
let filteredLocations = [];
let orderedLocations = [];
let selectedIndex = -1;
let selectedLocation = null;

const countryEntriesMap = new Map();
const regionEntriesMap = new Map();
const cityEntriesMap = new Map();

const regionsOfCountryMap = new Map();
const citiesOfRegionMap = new Map();

const locations = new Locations(BACKEND_ROOT_URL);

locations.getLocations()
    .then(() => {
        buildLocationFlatArray();
    })
    .catch(error => console.error(`Failed to reach location data from database: ${error}`));

searchLocationField.addEventListener("input", () => {
    const query = searchLocationField.value;

    searchLocationField.classList.remove("is-invalid");

    selectedLocation = null;
    selectedIndex = -1;

    filteredLocations = filterLocations(query);
    renderLocationDropdown(filteredLocations);
});

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const searchTerms = searchTermsField.value.trim();
    const searchLocationTyped = searchLocationField.value.trim();

    if (searchLocationTyped !== "" && !selectedLocation) {
        searchLocationField.classList.add("is-invalid");
        return;
    }

    searchLocationField.classList.remove("is-invalid");

    const searchLocation = selectedLocation ? selectedLocation.name : "";
    const searchLocationId = selectedLocation ? selectedLocation.id : "";
    const searchLocationType = selectedLocation ? selectedLocation.type : "";

    window.location.href = `${BACKEND_ROOT_URL}/search.html?` +
        `terms=${encodeURIComponent(searchTerms)}&` +
        `location=${encodeURIComponent(searchLocation)}&` +
        `type=${encodeURIComponent(searchLocationType)}&` +
        `id=${encodeURIComponent(searchLocationId)}`;
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
            postsList.appendChild(createPostCard(post));
        });

        if (typeof window.loadCarousels === "function") {
            await window.loadCarousels(postsList);
        }
    } catch (error) {
        console.error(error);
        postsList.innerHTML = `<p class="text-muted">Network error while loading posts.</p>`;
    }
});

// price => number
const formatPrice = (price) => {
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice)) {
        return "Price unavailable";
    }

    return `${parsedPrice} EUR`;
};

const buildLocationFlatArray = () => {
    locationsFlatArray = [];
    orderedLocations = [];

    countryEntriesMap.clear();
    regionEntriesMap.clear();
    cityEntriesMap.clear();
    regionsOfCountryMap.clear();
    citiesOfRegionMap.clear();

    const countries = locations.getCountries() || [];

    countries.forEach(country => {
        const countryId = country.getId();
        const countryName = country.getName();

        const countryEntry = {
            key: `country-${countryId}`,
            id: countryId,
            type: "country",
            name: countryName,
            filterText: countryName.toLowerCase(),
            level: 0
        }

        locationsFlatArray.push(countryEntry);
        orderedLocations.push(countryEntry);
        countryEntriesMap.set(countryId, countryEntry);

        const regions = locations.getRegionsOfCountry(countryId) || [];
        const regionEntries = [];

        regions.forEach(region => {
            const regionId = region.getId();
            const regionName = region.getName();

            const regionEntry = {
                key: `region-${regionId}`,
                id: regionId,
                type: "region",
                name: regionName,
                filterText: `${regionName} ${countryName}`.toLowerCase(),
                level: 1,
                countryId: countryId
            };

            locationsFlatArray.push(regionEntry);
            orderedLocations.push(regionEntry);
            regionEntries.push(regionEntry);
            regionEntriesMap.set(regionId, regionEntry);

            const cities = locations.getCitiesOfRegion(regionId);
            const cityEntries = [];

            cities.forEach(city => {
                const cityId = city.getId();
                const cityName = city.getName();

                const cityEntry = {
                    key: `city-${cityId}`,
                    id: cityId,
                    type: "city",
                    name: cityName,
                    filterText: `${cityName} ${regionName} ${countryName}`.toLowerCase(),
                    level: 2,
                    countryId: countryId,
                    regionId: regionId
                };

                locationsFlatArray.push(cityEntry);
                orderedLocations.push(cityEntry);
                cityEntries.push(cityEntry);
                cityEntriesMap.set(cityId, cityEntry);
            });

            citiesOfRegionMap.set(regionId, cityEntries);
        });

        regionsOfCountryMap.set(countryId, regionEntries);
    });
}

const filterLocations = (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery === "") return [];

    const renderItemsKeys = new Set();

    const locationMatches = locationsFlatArray.filter(location => location.filterText.includes(normalizedQuery));

    locationMatches.forEach(location => {
        if (location.type === "country") {
            renderItemsKeys.add(location.key);

            const regions = regionsOfCountryMap.get(location.id) || [];
            regions.forEach(region => {
                renderItemsKeys.add(region.key);

                const cities = citiesOfRegionMap.get(region.id) || [];
                cities.forEach(city => {
                    renderItemsKeys.add(city.key);
                });
            });
        }
        else if (location.type === "region") {
            const country = countryEntriesMap.get(location.countryId);
            if (country) renderItemsKeys.add(country.key);

            renderItemsKeys.add(location.key);

            const cities = citiesOfRegionMap.get(location.id) || [];
            cities.forEach(city => {
                renderItemsKeys.add(city.key);
            });
        }
        else if (location.type === "city") {
            const country = countryEntriesMap.get(location.countryId);
            if (country) renderItemsKeys.add(country.key);

            const region = regionEntriesMap.get(location.regionId);
            if (region) renderItemsKeys.add(region.key);

            renderItemsKeys.add(location.key);
        }
    });

    return orderedLocations.filter(location => renderItemsKeys.has(location.key));
}

const selectLocation = (location) => {
    selectedLocation = location;
    searchLocationField.value = location.name;
    searchLocationField.classList.remove("is-invalid");
    selectedIndex = -1;
    searchLocationDropdown.style.display = "none";
    searchLocationDropdown.innerHTML = "";
}

const renderLocationDropdown = (dropdownItems) => {
    searchLocationDropdown.innerHTML = "";

    if (dropdownItems.length === 0) {
        searchLocationDropdown.style.display = "none";
        return;
    }

    dropdownItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.dataset.index = index;

        if (item.level === 1) li.style.paddingLeft = "10px";
        else if (item.level === 2) li.style.paddingLeft = "20px";
        else li.style.paddingLeft = "0px";

        li.textContent = item.name;

        li.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            selectLocation(item);
        });

        searchLocationDropdown.appendChild(li);
    });

    searchLocationDropdown.style.display = "block";
}

document.addEventListener("pointerdown", (event) => {
    const clickedInsideDropdown = searchLocationDropdown.contains(event.target);
    const clickedInput = event.target === searchLocationField;

    if (!clickedInsideDropdown && !clickedInput) {
        searchLocationDropdown.style.display = "none";
    }
    else if (clickedInput && searchLocationDropdown.style.display === "none") {
        searchLocationDropdown.style.display = "block";
    }
});
