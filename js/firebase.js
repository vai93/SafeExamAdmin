import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
console.log("in firebase sript");
let db;

async function loadFirebaseConfig() {
  try {
    const TOKEN = "cdfsff123#dsfdsdf"; 

    const response = await fetch("https://proxy-node-server.vercel.app/api/firebase-config", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!response.ok) throw new Error("Unauthorized access");

    const config = await response.json();
    const app = initializeApp(config);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error loading Firebase config:", error);
  }
}

await loadFirebaseConfig();

const auth = getAuth();

const email = "vkpatel93@gmail.com"; // Predefined email
export async function signInUser() {
  if (auth.currentUser) {
    console.log("Already signed in");
    return; 
  }
  const password = window.prompt("Enter your password:");
  if (!password) {
    alert("Password is required to sign in.");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Signed in successfully");
  } catch (error) {
    console.error("Error signing in:", error.message);
    alert("Sign-in failed: " + error.message);
  }
}
export { db,auth }; 