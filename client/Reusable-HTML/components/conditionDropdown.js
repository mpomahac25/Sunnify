let conditionDropdown;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load smartCategoryDropdown.html
        const container = document.getElementById("condition-dropdown-container");
        if (!container) return;

        const res = await fetch("/Reusable-HTML/components/conditionDropdown.html");
        const html = await res.text();
        container.innerHTML += html;

        // Update references to fields
        conditionDropdown = container.querySelector("#condition-select");

        // Fetch data
        const conditions = await fetchConditions();
        if (!conditions) return;

        // Set data to dropdown
        setConditionDropdownValues(conditions);
    } catch (error) {
        console.error(error);
    }
});

const fetchConditions = async () => {
    const response = await fetch(`/post-conditions`, {
        method: "GET"
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch conditions with status ${response.status}`);
    }

    return response.json();
};

const setConditionDropdownValues = (conditions) => {
    if (!conditionDropdown) return;

    // No filter
    conditionDropdown.innerHTML = '<option value="">Any</option>';

    if (!Array.isArray(conditions)) return;

    conditions.forEach(condition => {
        const option = document.createElement("option");
        option.value = String(condition.id);
        option.textContent = condition.condition;
        conditionDropdown.appendChild(option);
    });
};

export const getSelectedCondition = () => {
    return conditionDropdown ? conditionDropdown.value : "";
};

export const clearSelectedCondition = () => {
    if (conditionDropdown) conditionDropdown.value = "";
};
