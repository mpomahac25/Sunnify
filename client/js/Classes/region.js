class Region {
    #name;
    #id;

    #countryId;

    #cityIds = new Set();

    constructor(name, id, countryId) {
        this.#name = name;
        this.#id = id;
        this.#countryId = countryId;
    }

    getName() {
        return this.#name;
    }

    getId() {
        return this.#id;
    }

    getCountryId() {
        return this.#countryId;
    }

    getCityIds() {
        return Array.from(this.#cityIds);
    }

    addCityId(cityId) {
        this.#cityIds.add(cityId);
    }

    clearCityIds() {
        this.#cityIds.clear();
    }

    //addCity(city) {
    //    if (this.#isValidCityObject(city)) this.#cityIds.add(city.getId());
    //    else if (typeof city === "number") this.#cityIds.add(city);
    //    else console.warn(`Received parameter which is neither a city nor a number: ${city}`);
    //}

    //addMultipleCities(cityArray) {
    //    if (!Array.isArray(cityArray)) return;
    //    cityArray.forEach(city => this.addCity(city));
    //}

    //removeCityById(cityId) {
    //    this.#cityIds.delete(cityId);
    //}

    //clearCityIds() {
    //    this.#cityIds.clear();
    //}

    //#isValidCityObject(city) {
    //    // Is it actually a city?
    //    if (!(city instanceof City)) return false;
    //    // Is it already in the array?
    //    if (this.#cityIds.has(city.getId())) return false;
    //    // Is its regionId same as this region's ID?
    //    if (city.getRegionId() !== this.#id) return false;

    //    return true;
    //}
}

export { Region };
