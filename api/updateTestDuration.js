const { db } = require("../firebase-admin-setup");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end(); // Handle preflight request
    }
    
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { testId, testDuration } = req.body;

        if (!testId || !testDuration || testDuration.trim() === "") {
            return res.status(400).json({ message: "Invalid request parameters." });
        }

        await db.collection("TestDetails").doc(testId).update({ testDuration: testDuration });

        return res.status(200).json({ success: true, message: "Test Duration updated successfully." });
    } catch (error) {
        console.error("Error updating test Duration:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
