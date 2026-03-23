document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("header-container");
    const brandHref = container?.dataset?.brandHref;
    const loginText = container?.dataset?.loginText;
    const loginHref = container?.dataset?.loginHref;

    fetch("/Reusable-HTML/components/header.html")
        .then(response => response.text())
        .then(html => {
            if (!container) return;
            container.innerHTML = html;

            if (brandHref) {
                const brand = container.querySelector('.navbar-brand');
                if (brand) brand.setAttribute('href', brandHref);
            }

            const loginBtn = container.querySelector('#login-logout-btn');
            if (loginBtn) {
                if (loginText) loginBtn.textContent = loginText;
                if (loginHref) loginBtn.setAttribute('href', loginHref);
            }
        });
});