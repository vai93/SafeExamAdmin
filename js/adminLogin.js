document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim(); // Trim email input
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("/api/adminLogin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login successful!");
            window.location.href = "\welcome.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        alert("Error in login: " + error.message);
    }
});
