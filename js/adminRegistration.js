document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("wk9qhm94B23_lBZWR");
});
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    showLoader();
    const name = document.getElementById("name").value.trim();
   const nuvID = document.getElementById("nuvID").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    try {
        const response = await fetch("api/adminRegistration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, nuvID, password, confirmPassword })
        });
        
        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            sendNotification(result.name,result.email);
            window.location.href = "\index.html";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error registering user.");
    }finally {
        hideLoader();
    }
});

function sendNotification(name,email){
    const templateParams = {
        to_email: "vaibhavik@nuv.ac.in",
        subject: "New account created in safe exam portal",
        rollnumber: name,
        uniqueKey: email
    };

    emailjs.send("service_fiyiagk", "template_fdt3ewg", templateParams)
        .then(response => {
            console.log(`Email sent to vaibhavik@nuv.ac.in:`);
        })
        .catch(error => {
            console.error(`Error sending email :`, error);
        })
}
function createLoader() {
    if (!document.getElementById("loader")) {
        const loaderDiv = document.createElement("div");
        loaderDiv.id = "loader";
        loaderDiv.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-size: 20px;
            font-weight: bold;
            color: #333;
        `;
        loaderDiv.innerHTML = `
            Processing... Please wait.
            <div id="spinner" style="
                border: 8px solid #6bf3ac;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
                margin-top: 10px;
            "></div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loaderDiv);
    }
}

function showLoader() {
    createLoader();
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    }
}

