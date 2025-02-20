import { db ,signInUser } from "./firebase.js";
import { setDoc, doc, collection } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
document.getElementById("registerForm").addEventListener("submit", async (event) =>  {
    event.preventDefault();
    await signInUser(); // Ensure the user is signed in first
    const gmail = document.getElementById("gmail").value;
    const name = document.getElementById("name").value;
    const nuvID = document.getElementById("nuvID").value;
    const apiKey = document.getElementById("apiKey").value;
    const authDomain = document.getElementById("authDomain").value;
    const storageBucket = document.getElementById("storageBucket").value;
    const messagingSenderId = document.getElementById("messagingSenderId").value;
    const appId = document.getElementById("appId").value;
    const measurementId = document.getElementById("measurementId").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, gmail, password);
        const user = userCredential.user;
        await setDoc(doc(collection(db, "SuperAdminUsers"), nuvID), {
            name:name,
            gmailID:gmail,
            nuvMailID: nuvID,
            apiKey: apiKey,
            authDomain: authDomain,
            storageBucket: storageBucket,
            messagingSenderId: messagingSenderId,
            appId: appId,
            measurementId: measurementId,
            password:password,
            uid: user.uid
        });

        alert("Registration successful!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error registering user:", error);
        alert("Error registering user: " + error.message);
    }
});


