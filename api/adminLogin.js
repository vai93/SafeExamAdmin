const { db } = require("../firebase-admin-setup");
const admin = require("firebase-admin");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const email = req.body.email?.trim(); // Trim email input
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {

        // Check if admin exists in Firestore
        const userDoc = await db.collection("adminDetails").doc(email).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "No admin record found." });
        }
        const userData = userDoc.data(); 
        if (userData.emailVerified==false) {
            return res.status(401).json({ message: "Email not verified. Please contact to the administrator for verification." });
        }
        if (userData.password===password) {
            return res.status(200).json({ message: "Login successful!",email:userData.email, name: userData.name });
        }
        return res.status(401).json({ message: "You have entered the Wrong pasword" });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Error logging in", error: error.message });
    }
};
