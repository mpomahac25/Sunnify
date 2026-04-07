import { Locations } from "../../js/Classes/locations.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

let locationInputField;
let locationDropdown;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load smartLocationDropdown.html
        const container = document.getElementById("smart-location-dropdown-container");
        if (!container) return;

        const res = await fetch("/Reusable-HTML/components/smartLocationDropdown.html");
        const html = await res.text();
        container.innerHTML += html;

        // Update references to fields
        locationInputField = container.querySelector("#location-input");
        locationDropdown = container.querySelector("#location-dropdown");

        // Set event listener on text input field
        locationInputField.addEventListener("input", () => {
            const query = locationInputField.value;

            locationInputField.classList.remove("is-invalid");

            selectedLocation = null;
            selectedIndex = -1;

            filteredLocations = filterLocations(query);
            renderLocationDropdown(filteredLocations);
        });
    } catch (error) {
        console.error(error);
    }
});

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
};

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
};

const selectLocation = (location) => {
    selectedLocation = location;
    locationInputField.value = location.name;
    clearLocationInvalid();
    selectedIndex = -1;
    locationDropdown.style.display = "none";
    locationDropdown.innerHTML = "";
};

const renderLocationDropdown = (dropdownItems) => {
    locationDropdown.innerHTML = "";

    if (dropdownItems.length === 0) {
        locationDropdown.style.display = "none";
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

        locationDropdown.appendChild(li);
    });

    locationDropdown.style.display = "block";
};

document.addEventListener("pointerdown", (event) => {
    const clickedInsideDropdown = locationDropdown.contains(event.target);
    const clickedInput = event.target === locationInputField;

    if (!clickedInsideDropdown && !clickedInput) {
        locationDropdown.style.display = "none";
    }
    else if (clickedInput && locationDropdown.style.display === "none") {
        locationDropdown.style.display = "block";
    }
});

export const getSelectedLocation = () => selectedLocation;

export const getTypedLocationValue = () => {
    return locationInputField ? locationInputField.value.trim() : "";
};

export const markLocationInvalid = () => {
    if (locationInputField) {
        locationInputField.classList.add("is-invalid");
    }
};

export const clearLocationInvalid = () => {
    if (locationInputField) {
        locationInputField.classList.remove("is-invalid");
    }
};
