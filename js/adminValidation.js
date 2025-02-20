import { db  } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check if email is a Gmail ID
    if (!email.endsWith("@nuv.ac.in")) {
        alert("Please use a NUV ID for login.");
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "SuperAdminUsers"));
        
        if (userDoc.exists()) {
            alert("Login successful!");
            window.location.href = "welcome.html";
        } else {
            alert("No admin record found.");
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        alert("Error in login: " + error.message);
    }
});

