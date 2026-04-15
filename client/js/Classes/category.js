class Category {
	#id
	#name

	#subcategoryIds = new Set();

	constructor(id, name) {
		this.#id = id;
		this.#name = name;
	}

	getId() {
		return this.#id;
	}

	getName() {
		return this.#name;
	}

	getSubcategoryIds() {
		return Array.from(this.#subcategoryIds);
	}

	addSubcategoryId(subcategoryId) {
		this.#subcategoryIds.add(subcategoryId);
	}

	clearSubcategoryIds() {
		this.#subcategoryIds.clear();
	}
}

export { Category };