import { db  } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check if email is a Gmail ID
    if (!email.endsWith("@gmail.com")) {
        alert("Please use a Gmail ID for login.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "SuperAdminUsers", user.uid));
        
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

