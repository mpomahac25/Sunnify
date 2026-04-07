import { Locations } from "./Classes/locations.js";

(() => {
    const CREATE_POST_BACKEND_URL = "http://127.0.0.1:3000";
    
    //location section
    const locations = new Locations(CREATE_POST_BACKEND_URL);

    let locationsFlatArray = [];
    let filteredLocations = [];
    let orderedLocations = [];
    let selectedLocation = null;

    const countryEntriesMap = new Map();
    const regionEntriesMap = new Map();
    const cityEntriesMap = new Map();

    const regionsOfCountryMap = new Map();
    const citiesOfRegionMap = new Map();

    document.addEventListener("DOMContentLoaded", async () => {
        // gets elems by ids
        const form = document.querySelector(".createpost-form-card form");
        const titleField = document.getElementById("listing-title");
        const descriptionField = document.getElementById("listing-description");
        const priceField = document.getElementById("listing-price");
        const conditionField = document.getElementById("listing-condition");
        const locationField = document.getElementById("listing-location");
        const locationIdField = document.getElementById("listing-location-id");
        const locationDropdown = document.getElementById("listing-location-dropdown");
        const categoryField = document.getElementById("listing-category");
        if (!form) {
            return;
        }

        try {
            await locations.getLocations();
            buildLocationFlatArray();
        } catch (error) {
            console.error(`Failed to reach location data from database: ${error}`);
        }

        locationField.addEventListener("input", () => {
            const query = locationField.value;

            locationField.classList.remove("is-invalid");
            locationIdField.value = "";

            selectedLocation = null;

            filteredLocations = filterLocations(query);
            renderLocationDropdown(filteredLocations, locationDropdown, locationField, locationIdField);
        });

        try {
            //checks if user logged in
            const sessionResponse = await fetch(`${CREATE_POST_BACKEND_URL}/check-session`, {
                method: "get",
                credentials: "include"
            });

            const sessionResult = await sessionResponse.json();

            if (!sessionResult.loggedIn) {
                window.location.href = "login.html";
                return;
            }
        } catch (error) {
            console.error(error);
            alert("Could not verify session.");
            return;
        }

        // when publish btn clicked
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            // takes values
            const title = titleField.value.trim();
            const description = descriptionField.value.trim();
            const price = priceField.value.trim();
            const condition = conditionField.value;
            const location = locationField.value.trim();
            const cityId = locationIdField.value.trim();
            const category = categoryField.value;

            //validation
            const validationError = validateForm({
                title,
                description,
                price,
                condition,
                location,
                cityId,
                category
            });

            if (validationError) {
                alert(validationError);
                return;
            }

            // will be sent to backend
            const payload = {
                title,
                description,
                price: Number(price),
                condition,
                location,
                category,
                status: "available"
            };

            try {
                // sends to /posts
                const response = await fetch(`${CREATE_POST_BACKEND_URL}/posts`, {
                    method: "post",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                //if not succesful
                if (!response.ok) {
                    alert(result.error || "Post creation failed.");
                    return;
                }

                // succesful response
                window.location.href = `post.html?id=${result.id}`;
            } catch (error) {
                console.error(error);
                alert("Network error while creating post.");
            }

            document.addEventListener("pointerdown", (event) => {
                const clickedInsideDropdown = locationDropdown.contains(event.target);
                const clickedInput = event.target === locationField;

                if (!clickedInsideDropdown && !clickedInput) {
                    locationDropdown.style.display = "none";
                }
            });
        });
    });
    // validation during user creating post
    const validateForm = ({ title, description, price, condition, location, cityId, category }) => {
        if (!title) {
            return "Title is required.";
        }

        if (!description) {
            return "Description is required.";
        }

        if (!price) {
            return "Price is required.";
        }

        const parsedPrice = Number(price);

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return "Price must be a valid non-negative number.";
        }

        if (!condition || condition === "Choose condition") {
            return "Please choose a condition.";
        }

        if (!location || !cityId) {
            return "Please choose a city from the list.";
        }

        if (!category || category === "Select category") {
            return "Please choose a category.";
        }
        // if no problems - returns null
        return null;
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

    const selectLocation = (location, locationField, locationIdField, locationDropdown) => {
        selectedLocation = location;
        locationField.value = location.name;
        locationIdField.value = location.id;
        locationField.classList.remove("is-invalid");
        locationDropdown.style.display = "none";
        locationDropdown.innerHTML = "";
    };

    const renderLocationDropdown = (dropdownItems, locationDropdown, locationField, locationIdField) => {
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

            if (item.type !== "city") {
                return;
            }

            li.textContent = item.name;

            li.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                selectLocation(item, locationField, locationIdField, locationDropdown);
            });

            locationDropdown.appendChild(li);
        });

        locationDropdown.style.display = "block";
    }
})();
