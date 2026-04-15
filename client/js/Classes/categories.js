import { Subcategory } from "./subcategory.js";
import { Category } from "./category.js";

class Categories {
    #subcategories = new Map();
    #categories = new Map();

    #allCategories = new Map();

    #backendUrl = "";

    constructor(url) {
        this.#backendUrl = url;

        this.#allCategories.set("Subcategories", this.#subcategories);
        this.#allCategories.set("Categories", this.#categories);
    }

    getAllCategories() {
        return new Promise(async (resolve, reject) => {
            fetch(`${this.#backendUrl}/categories`)
                .then((response) => response.json())
                .then((json) => {
                    this.#readJson(json);
                    resolve(this.#allCategories);
                }, error => {
                    reject(error);
                });
        });
    }

    getMainCategories() {
        return Array.from(this.#categories.values());
    }

    getSubcategories() {
        return Array.from(this.#subcategories.values());
    }

    getMainCategoryById(categoryId) {
        return this.#categories.get(categoryId);
    }

    getSubcategoryById(subcategoryId) {
        return this.#subcategories.get(subcategoryId);
    }

    getSubcategoriesOfCategory(categoryId) {
        const category = this.#categories.get(categoryId);

        if (!category) {
            console.warn(`Attempted to find main category with ID ${categoryId}, but found nothing`);
            return;
        }

        return category.getSubcategoryIds().map(subcategoryId => this.getSubcategoryById(subcategoryId));
    }

    #readJson = (categoriesAsJson) => {
        categoriesAsJson
            .filter(categoryNode => categoryNode.id > 0)
            .forEach(categoryNode => {
                const categoryId = categoryNode.id;
                const categoryName = categoryNode.category;

                const category = new Category(categoryId, categoryName);
                this.#categories.set(categoryId, category);

                categoryNode.subcategories.forEach(subcategoryNode => {
                    const subcategoryId = subcategoryNode.id;
                    const subcategoryName = subcategoryNode.subcategory;

                    const subcategory = new Subcategory(subcategoryId, subcategoryName, categoryId);
                    this.#subcategories.set(subcategoryId, subcategory);

                    category.addSubcategoryId(subcategoryId);
                });
            });
    }
}

export { Categories };
