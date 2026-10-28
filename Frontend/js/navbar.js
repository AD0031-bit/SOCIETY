/**
 * THE SOCIETY - Universal Navigation & Authentication Guard
 */

(function () {
    // Current authenticated user
    const rawUser = localStorage.getItem("societyUser");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("societyToken") || "";

    // Pages that require being logged in
    const protectedPages = [
        "dashboard.html",
        "profile.html",
        "mentorship.html",
        "opportunities.html",
        "projects.html",
        "qa.html",
        "network.html"
    ];

    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1);

    if (protectedPages.includes(currentPage) && !user) {
        window.location.href = "login.html";
        return;
    }

    // Expose helpers globally
    window.SocietyAuth = {
        getUser: () => user,
        getToken: () => token,
        logout: () => {
            localStorage.removeItem("societyUser");
            localStorage.removeItem("societyToken");
            window.location.href = "login.html";
        },
        refreshUser: async () => {
            if (!token) return user;
            try {
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("societyUser", JSON.stringify(data.user));
                    return data.user;
                }
            } catch (e) {
                console.error("Failed to refresh user:", e);
            }
            return user;
        }
    };

    // Render universal navigation header if <header id="societyHeader"></header> is present
    function renderNavbar() {
        const headerEl = document.getElementById("societyHeader");
        if (!headerEl) return;

        const roleBadge = user ? `<span class="user-role-badge">${user.role.toUpperCase()}</span>` : "";
        const repBadge = user && user.reputation !== undefined ? `<span class="user-rep-badge">⭐ ${user.reputation} pts</span>` : "";

        headerEl.innerHTML = `
            <nav class="navbar society-app-nav">
                <a href="dashboard.html" class="logo">THE SOCIETY</a>

                <ul class="nav-links">
                    <li><a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active-link' : ''}">Dashboard</a></li>
                    <li><a href="network.html" class="${currentPage === 'network.html' ? 'active-link' : ''}">Network</a></li>
                    <li><a href="mentorship.html" class="${currentPage === 'mentorship.html' ? 'active-link' : ''}">Mentorship</a></li>
                    <li><a href="opportunities.html" class="${currentPage === 'opportunities.html' ? 'active-link' : ''}">Opportunities</a></li>
                    <li><a href="projects.html" class="${currentPage === 'projects.html' ? 'active-link' : ''}">Projects</a></li>
                    <li><a href="qa.html" class="${currentPage === 'qa.html' ? 'active-link' : ''}">Community Q&A</a></li>
                </ul>

                <div class="nav-buttons">
                    ${user ? `
                        <a href="profile.html" class="profile-nav-link ${currentPage === 'profile.html' ? 'active-link' : ''}">
                            <span class="user-nav-name">${user.name}</span>
                            ${roleBadge}
                            ${repBadge}
                        </a>
                        <button id="globalLogoutBtn" class="login-btn logout-action-btn" title="Sign out">Logout</button>
                    ` : `
                        <a href="login.html" class="login-btn">Login</a>
                        <a href="register.html" class="signup-btn">Join Society</a>
                    `}
                </div>
            </nav>
        `;

        const logoutBtn = document.getElementById("globalLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => window.SocietyAuth.logout());
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderNavbar);
    } else {
        renderNavbar();
    }
})();
