class Subcategory {
	#id
	#name

	#categoryId

	constructor(id, name, categoryId) {
		this.#id = id;
		this.#name = name;
		this.#categoryId = categoryId;
	}

	getId() {
		return this.#id;
	}

	getName() {
		return this.#name;
	}

	getParentCategoryId() {
		return this.#categoryId;
	}
}

export { Subcategory };