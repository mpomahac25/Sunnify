import { City } from "./city.js";
import { Region } from "./region.js";
import { Country } from "./country.js";

class Locations {
    #countries = new Map();
    #regions = new Map();
    #cities = new Map();

    #locations = new Map();

    #backendUrl = "";

    constructor(url) {
        this.#backendUrl = url;

        this.#locations.set("Countries", this.#countries);
        this.#locations.set("Regions", this.#regions);
        this.#locations.set("Cities", this.#cities);
    }

    getLocations = () => {
        return new Promise(async (resolve, reject) => {
            fetch(`${this.#backendUrl}/locations`)
                .then((response) => response.json())
                .then((json) => {
                    this.#readJson(json);
                    resolve(this.#locations);
                }, error => {
                    reject(error);
                });
        });
    }

    getCountries() {
        return Array.from(this.#countries.values());
    }

    getRegions() {
        return Array.from(this.#regions.values());
    }

    getCities() {
        return Array.from(this.#cities.values());
    }

    getCountryById(id) {
        return this.#countries.get(id) || null;
    }

    getRegionById(id) {
        return this.#regions.get(id) || null;
    }

    getCityById(id) {
        return this.#cities.get(id) || null;
    }

    getRegionsOfCountry(countryId) {
        const country = this.getCountryById(countryId);
        if (!country) {
            console.warn(`Attempted to find country with ID ${countryId}, but found nothing`);
            return;
        }

        return country.getRegionIds().map(regionId => this.getRegionById(regionId));
    }

    getCitiesOfRegion(regionId) {
        const region = this.getRegionById(regionId);
        if (!region) {
            console.warn(`Attempted to find region with ID ${regionId}, but found nothing`);
            return;
        }

        return region.getCityIds().map(cityId => this.getCityById(cityId));
    }

    getCitiesOfCountry(countryId) {
        const country = this.getCountryById(countryId);
        if (!country) {
            console.warn(`Attempted to find country with ID ${countryId}, but found nothing`);
            return;
        }

        return country.getCityIds().map(cityId => this.getCityById(cityId));
    }

    #readJson = (locationsAsJson) => {
        locationsAsJson
            .filter(countryNode => countryNode.id > 0)
            .forEach(countryNode => {
                const countryId = countryNode.id;
                const countryName = countryNode.country;

                const country = new Country(countryName, countryId);
                this.#countries.set(countryId, country);

                countryNode.regions.forEach(regionNode => {
                    const regionId = regionNode.id;
                    const regionName = regionNode.region;

                    const region = new Region(regionName, regionId, countryId);
                    this.#regions.set(regionId, region);

                    country.addRegionId(regionId);

                    regionNode.cities.forEach(cityNode => {
                        const cityId = cityNode.id;
                        const cityName = cityNode.city;

                        const city = new City(cityName, cityId, regionId, countryId);
                        this.#cities.set(cityId, city);

                        region.addCityId(cityId);
                        country.addCityId(cityId);
                    });
                });
            });
    }
}

export { Locations };
