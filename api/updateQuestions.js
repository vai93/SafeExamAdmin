const { db } = require("../firebase-admin-setup");
const XLSX = require("xlsx");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

    try {
        const { testId, fileData } = req.body;
        if (!testId || !fileData) {
            return res.status(400).json({ message: "Missing testId or file data" });
        }

        const fileBuffer = Buffer.from(fileData, "base64");
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            return res.status(400).json({ message: "Uploaded file is empty." });
        }

        const questionsCollection = db.collection(`${testId}Questions`);
        const snapshot = await questionsCollection.get();
        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        let questionNumber = 1;
        for (let row of data) {
            // Safely handle marks
            let marks = 1;
            if (row.hasOwnProperty('marks') && row.marks !== "" && !isNaN(row.marks)) {
                marks = Number(row.marks);
            }

            const questionData = {
                question: row.question ? String(row.question).trim() : null,
                options: [
                    row.option1 ? String(row.option1).trim() : null,
                    row.option2 ? String(row.option2).trim() : null,
                    row.option3 ? String(row.option3).trim() : null,
                    row.option4 ? String(row.option4).trim() : null
                ].filter(opt => opt !== null && opt !== ""),
                answer: row.answer ? String(row.answer).trim() : "NA",
                marks
            };

            if (row.imageURL && String(row.imageURL).trim() !== "") {
                questionData.imageURL = row.imageURL;
            }

            await questionsCollection.doc(`question${questionNumber}`).set(questionData);
            questionNumber++;
        }
            return res.json({ message: "Questions updated successfully." });
        
    } catch (error) {
        console.error("Error updating:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

