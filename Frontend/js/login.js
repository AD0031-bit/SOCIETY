const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Logging in...";
    loginMessage.style.color = "var(--text-secondary)";

    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("societyUser", JSON.stringify(data.user));
            if (data.token) {
                localStorage.setItem("societyToken", data.token);
            }

            loginMessage.style.color = "#4ade80";
            loginMessage.textContent = "Login successful! Redirecting...";

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 600);
        } else {
            loginMessage.style.color = "#f87171";
            loginMessage.textContent = data.message || "Invalid email or password.";
        }
    } catch (error) {
        console.error("Login error:", error);
        loginMessage.style.color = "#f87171";
        loginMessage.textContent = "Unable to connect to the server. Please ensure the backend is running.";
    }
});
