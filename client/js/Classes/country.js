class Country {
    #name;
    #id;

    #cityIds = new Set();
    #regionIds = new Set();

    constructor(name, id) {
        this.#name = name;
        this.#id = id;
    }

    getName() {
        return this.#name;
    }

    getId() {
        return this.#id;
    }

    getRegionIds() {
        return Array.from(this.#regionIds);
    }

    getCityIds() {
        return Array.from(this.#cityIds);
    }

    addRegionId(regionId) {
        this.#regionIds.add(regionId);
    }

    addCityId(cityId) {
        this.#cityIds.add(cityId);
    }

    clearRegionIds() {
        this.#regionIds.clear();
    }

    clearCityIds() {
        this.#cityIds.clear();
    }

    //addRegion(region) {
    //    let regionId;

    //    if (this.#isValidRegionObject(region)) regionId = region.getId();
    //    else if (typeof region === "number") regionId = region;
    //    else {
    //        console.warn(`Received parameter which is neither a region nor a number: ${region}`);
    //        return;
    //    }

    //    this.#regionIds.add(regionId);
    //    this.#loadCities();
    //}

    //addMultipleRegions(regionArray) {
    //    if (!Array.isArray(regionArray)) return;

    //    for (const region of regionArray) {
    //        this.addRegion(region);
    //    }
    //}

    //removeRegionById(regionId) {
    //    this.#regionIds.delete(regionId);
    //}

    //removeCityById(cityId) {
    //    this.#cityIds.delete(cityId);
    //}

    //#isValidRegionObject(region) {
    //    // Is it actually a region?
    //    if (!(region instanceof Region)) return false;
    //    // Is it already in the array?
    //    if (this.#regions.some(r => r.getId() === region.getId())) return false;
    //    // Is its countryId same as this country's ID?
    //    if (region.getCountryId() !== this.#id) return false;

    //    return true;
    //}
}

export { Country };
