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
            const allowedStudents = [];
            const newStudents = [];
        
            for (let row of data) {
                const rollNumber = String(row[Object.keys(row)[0]]).trim();
                const name = String(row[Object.keys(row)[1]]).trim();
                const email = String(row[Object.keys(row)[2]]).trim();
        
                if (!rollNumber || !name || !email) continue;
        
                allowedStudents.push(rollNumber);
        
                const studentRef = db.collection("studentDetails").doc(rollNumber);
                const studentDoc = await studentRef.get();
        
                if (!studentDoc.exists) {
                    const uniqueKey = Math.floor(1000 + Math.random() * 9000).toString();
                    await studentRef.set({ email, name, rollNumber, uniqueKey });
                    newStudents.push({ email, name, rollNumber, uniqueKey });
                }
            }
        
            await db.collection("TestDetails").doc(testId).update({ allowedStudents });
            if(newStudents){
            const pendingEmailsCollection = db.collection("pendingEmails");
            for (let student of newStudents) {
                await pendingEmailsCollection.doc(student.email).set({
                    name: student.name,
                    rollNumber: student.rollNumber,
                    email: student.email,
                    uniqueKey: student.uniqueKey,
                    createdAt: new Date(),
                });
            }
        }
            return res.json({ message: "Student list updated successfully.",newStudents });
    } catch (error) {
        console.error("Error updating:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

