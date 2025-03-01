const { db } = require("../firebase-admin-setup");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end(); // Preflight request response
    }
    
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { testId } = req.body;

        if (!testId) {
            return res.status(400).json({ message: "Missing testId" });
        }

        const responsesCollection = db.collection(`${testId}StudentResponses`);

        // Fetch all documents in the responses collection
        const snapshot = await responsesCollection.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No responses found for this test." });
        }

        // Batch delete all documents
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        return res.json({ success: true, message: "All responses deleted successfully!" });
    } catch (error) {
        console.error("Error deleting responses:", error);
        return res.status(500).json({ message: "Failed to delete responses" });
    }
};
