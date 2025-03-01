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

    const { adminEmail } = req.body;

    if (!adminEmail) {
        return res.status(400).json({ message: "Admin email is required." });
    }

    try {
        const testsRef = db.collection("TestDetails");
        const snapshot = await testsRef.where("adminEmail", "==", adminEmail).get();

        if (snapshot.empty) {
            return res.status(200).json({ tests: [] });
        }

        let tests = [];
        snapshot.forEach((doc) => {
            tests.push({ docID: doc.id, ...doc.data() });
        });

        return res.status(200).json({ tests });
    } catch (error) {
        console.error("Error fetching tests:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
