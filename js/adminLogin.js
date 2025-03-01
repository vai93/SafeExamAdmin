document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim(); // Trim email input
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/adminLogin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login successful!");
            sessionStorage.setItem("admin",data.name);
            sessionStorage.setItem("adminEmail",data.email);
            window.location.href = "\dashboard.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        alert("Error in login: " + error.message);
    }
});
