const BACKEND_ROOT_URL = "http://127.0.0.1:3000";


(function () {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const applyBtn = document.getElementById('apply-filters-btn');
    const resetBtn = document.getElementById('reset-filters-btn');
    const filtersCollapse = document.getElementById('filtersCollapse');
    const sortSelect = document.getElementById('sort-select');

    function updateResultsCount() {
    const count = resultsGrid ? resultsGrid.querySelectorAll('.result-card').length : 0;
    if (resultsCount) resultsCount.textContent = count + (count === 1 ? ' result' : ' results');
    }

    // simple demo handlers (replace with real filtering/sorting logic)
    if (applyBtn) {
    applyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // TODO: implement actual filtering call here
        // close filters on mobile (bootstrap collapse)
        if (filtersCollapse && window.bootstrap) {
        const bsCollapse = bootstrap.Collapse.getInstance(filtersCollapse) || new bootstrap.Collapse(filtersCollapse, {toggle:false});
        if (window.innerWidth < 992) bsCollapse.hide();
        }
        updateResultsCount();
    });
    }

    if (resetBtn) {
    resetBtn.addEventListener('click', function () {
        document.getElementById('location-select').value = '';
        document.getElementById('category-select').value = '';
        updateResultsCount();
    });
    }

    if (sortSelect) {
    sortSelect.addEventListener('change', function () {
        // TODO: implement real sorting of cards
        // for now visual placeholder only
        console.log('Sort:', sortSelect.value);
    });
    }

    // initial count
    updateResultsCount();
})();

document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
    e.preventDefault();
    // update visible label
    document.getElementById('sortDropdown').textContent = item.textContent;
    // mark active
    document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    // TODO: call your sort/filter function with item.dataset.value
    console.log('Sort selected:', item.dataset.value);
            });
        });