const { db } = require("../firebase-admin-setup");
const admin = require("firebase-admin");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { name, email, rollNumber, uniqueKey } = req.body;

        if (!name || !email || !rollNumber || !uniqueKey) {
            return res.status(400).json({ message: "Missing student details" });
        }

        await db.collection("FailedEmails").doc(rollNumber).set({
            name,
            email,
            rollNumber,
            uniqueKey,
            timestamp: new Date()
        });

        return res.status(200).json({ message: "Failed email logged successfully" });
    } catch (error) {
        console.error("Error storing failed email:", error);
        return res.status(500).json({ message: "Error storing failed email", error: error.message });
    }
};
