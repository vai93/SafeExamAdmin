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

    const { responsedb } = req.body;
    if (!responsedb) {
        return res.status(400).json({ message: "Response database (collection) is required." });
    }

    try {
        const snapshot = await db.collection(responsedb).get();
        const responses = [];
        if (snapshot.empty) {
            return res.status(200).json({ responses: [] });
        }

        snapshot.forEach((doc) => {
            responses.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json({ responses });

    } catch (error) {
        console.error("Error fetching quiz responses:", error);
        return res.status(500).json({ message: "Error fetching quiz responses.", error: error.message });
    }
};
