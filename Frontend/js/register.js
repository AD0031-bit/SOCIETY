const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    registerMessage.textContent = "Creating your account...";
    registerMessage.style.color = "var(--text-secondary)";

    try {
        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (response.ok) {
            registerMessage.style.color = "#4ade80";
            registerMessage.textContent = "Account created! Redirecting to your dashboard...";

            if (data.user) {
                localStorage.setItem("societyUser", JSON.stringify(data.user));
            }
            if (data.token) {
                localStorage.setItem("societyToken", data.token);
            }

            registerForm.reset();

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 800);
        } else {
            registerMessage.style.color = "#f87171";
            registerMessage.textContent = data.message || "Registration failed.";
        }
    } catch (error) {
        console.error("Registration error:", error);
        registerMessage.style.color = "#f87171";
        registerMessage.textContent = "Unable to connect to the server. Please ensure backend is running.";
    }
});
