const { db } = require("../firebase-admin-setup");
const admin = require("firebase-admin");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const email = req.body.email?.trim(); // Trim email input
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // Get user by email from Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);

        if (!userRecord.emailVerified) {
            return res.status(401).json({ message: "Email not verified. Please check your inbox." });
        }

        // Check if admin exists in Firestore
        const userDoc = await db.collection("SuperAdminUsers").doc(email).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "No admin record found." });
        }

        return res.status(200).json({ message: "Login successful!" });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Error logging in", error: error.message });
    }
};
