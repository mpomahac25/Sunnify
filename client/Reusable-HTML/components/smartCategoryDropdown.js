import { Categories } from "../../js/Classes/categories.js";

let categoryInputField;
let categoryDropdown;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load smartCategoryDropdown.html
        const container = document.getElementById("smart-category-dropdown-container");
        if (!container) return;

        const res = await fetch("/Reusable-HTML/components/smartCategoryDropdown.html");
        const html = await res.text();
        container.innerHTML += html;

        // Update references to fields
        categoryInputField = container.querySelector("#category-input");
        categoryDropdown = container.querySelector("#category-dropdown");

        // Set event listener on text input field
        categoryInputField.addEventListener("input", () => {
            const query = categoryInputField.value;

            categoryInputField.classList.remove("is-invalid");

            selectedCategory = null;
            selectedIndex = -1;

            filteredCategories = filterCategories(query);
            renderCategoryDropdown(filteredCategories);
        });
    } catch (error) {
        console.error(error);
    }
});

let categoriesFlatArray = [];
let filteredCategories = [];
let orderedCategories = [];
let selectedIndex = -1;
let selectedCategory = null;

const mainCategoryEntriesMap = new Map();
const subcategoryEntriesMap = new Map();

const subcategoriesOfCategoryMap = new Map();

const categories = new Categories();

categories.getAllCategories()
    .then(() => {
        buildCategoryFlatArray();
    })
    .catch(error => console.error(`Failed to read category data from database: ${error}`));

const buildCategoryFlatArray = () => {
    categoriesFlatArray = [];
    orderedCategories = [];

    mainCategoryEntriesMap.clear();
    subcategoryEntriesMap.clear();
    subcategoriesOfCategoryMap.clear();

    const mainCategories = categories.getMainCategories() || [];

    mainCategories.forEach(category => {
        const categoryId = category.getId();
        const categoryName = category.getName();

        const categoryEntry = {
            key: `category-${categoryId}`,
            id: categoryId,
            type: "category",
            name: categoryName,
            filterText: categoryName.toLowerCase(),
            level: 0
        }

        categoriesFlatArray.push(categoryEntry);
        orderedCategories.push(categoryEntry);
        mainCategoryEntriesMap.set(categoryId, categoryEntry);

        const subcategories = categories.getSubcategoriesOfCategory(categoryId) || [];
        const categoryEntries = [];

        subcategories.forEach(subcategory => {
            const subcategoryId = subcategory.getId();
            const subcategoryName = subcategory.getName();

            const subcategoryEntry = {
                key: `subcategory-${subcategoryId}`,
                id: subcategoryId,
                type: "subcategory",
                name: subcategoryName,
                filterText: `${subcategoryName} ${categoryName}`.toLowerCase(),
                level: 1,
                categoryId: categoryId
            };

            categoriesFlatArray.push(subcategoryEntry);
            orderedCategories.push(subcategoryEntry);
            categoryEntries.push(subcategoryEntry);
            subcategoryEntriesMap.set(subcategoryId, subcategoryEntry);
        });

        subcategoriesOfCategoryMap.set(categoryId, categoryEntries);
    });
};

const filterCategories = (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery === "") return [];

    const renderItemsKeys = new Set();

    const categoryMatches = categoriesFlatArray.filter(category => category.filterText.includes(normalizedQuery));

    categoryMatches.forEach(categoryMatch => {
        if (categoryMatch.type === "category") {
            renderItemsKeys.add(categoryMatch.key);

            const subcategories = subcategoriesOfCategoryMap.get(categoryMatch.id) || [];
            subcategories.forEach(subcategory => {
                renderItemsKeys.add(subcategory.key);
            });
        }
        else if (categoryMatch.type === "subcategory") {
            const mainCategory = mainCategoryEntriesMap.get(categoryMatch.categoryId);
            if (mainCategory) renderItemsKeys.add(mainCategory.key);

            renderItemsKeys.add(categoryMatch.key);
        }
    });

    return orderedCategories.filter(category => renderItemsKeys.has(category.key));
};

const selectCategory = (category) => {
    selectedCategory = category;
    categoryInputField.value = category.name;
    clearCategoryInvalid();
    selectedIndex = -1;
    categoryDropdown.style.display = "none";
    categoryDropdown.innerHTML = "";
};

const renderCategoryDropdown = (dropdownItems) => {
    categoryDropdown.innerHTML = "";

    if (dropdownItems.length === 0) {
        categoryDropdown.style.display = "none";
        return;
    }

    dropdownItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.dataset.index = index;

        const padding = `${item.level * 10}px`;
        li.style.paddingLeft = padding;

        li.textContent = item.name;

        li.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            selectCategory(item);
        });

        categoryDropdown.appendChild(li);
    });

    categoryDropdown.style.display = "block";
};

document.addEventListener("pointerdown", (event) => {
    const clickedInsideDropdown = categoryDropdown.contains(event.target);
    const clickedInput = event.target === categoryInputField;

    if (!clickedInsideDropdown && !clickedInput) {
        categoryDropdown.style.display = "none";
    }
    else if (clickedInput && categoryDropdown.style.display === "none") {
        categoryDropdown.style.display = "block";
    }
});

export const getSelectedCategory = () => selectedCategory;

export const getTypedCategoryValue = () => {
    return categoryInputField ? categoryInputField.value.trim() : "";
};

export const clearSelectedCategory = () => {
    selectedCategory = null;
    selectedIndex = -1;

    if (categoryInputField) {
        categoryInputField.value = "";
        categoryInputField.classList.remove("is-invalid");
    }

    if (categoryDropdown) {
        categoryDropdown.innerHTML = "";
        categoryDropdown.style.display = "none";
    }
};

export const markCategoryInvalid = () => {
    if (categoryInputField) {
        categoryInputField.classList.add("is-invalid");
    }
};

export const clearCategoryInvalid = () => {
    if (categoryInputField) {
        categoryInputField.classList.remove("is-invalid");
    }
};
