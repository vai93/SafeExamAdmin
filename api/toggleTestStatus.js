const { db } = require("../firebase-admin-setup");
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


    const { testId, isActive } = req.body; // Get test ID and new status

    if (!testId) {
        return res.status(400).json({ message: "Test ID is required." });
    }

    try {
        // Update `isActive` field in Firestore
        await db.collection("TestDetails").doc(testId).update({ isActive });

        res.status(200).json({ message: `Test ${isActive ? "started" : "stopped"} successfully.` });
    } catch (error) {
        console.error("Error updating test status:", error);
        res.status(500).json({ message: "Failed to update test status", error: error.message });
    }
};
