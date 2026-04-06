class City {
    #name;
    #id;

    #regionId;

    #countryId;

    constructor(name, id, regionId, countryId) {
        this.#name = name;
        this.#id = id;
        this.#regionId = regionId;
        this.#countryId = countryId;
    }

    getName() {
        return this.#name;
    }

    getId() {
        return this.#id;
    }

    getRegionId() {
        return this.#regionId;
    }

    getCountryId() {
        return this.#countryId;
    }
}

export { City };