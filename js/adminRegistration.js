document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const nuvID = document.getElementById("nuvID").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
     loader.style.display = "flex";
    spinner.style.display = "block";
    try {
        const response = await fetch("api/adminRegistration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, nuvID, password, confirmPassword })
        });
        
        const result = await response.json();
        loader.style.display = "none";
        spinner.style.display = "none";
        alert(result.message);

        if (response.ok) {
            window.location.href = "\index.html";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error registering user.");
    }
});
