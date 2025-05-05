const { db } = require("../firebase-admin-setup");
const admin = require("firebase-admin");
const XLSX = require("xlsx");
const path = require("path");
require('dotenv').config();
module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end(); // Respond to preflight requests
    }
    if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

   try {
        const { testId, testTitle, testDuration, questionFileData, studentFileData, adminEmail } = req.body;

        if (!questionFileData) {
            return res.status(400).json({ message: "Question file is required" });
        }

        // Convert Base64 to Buffer
        const questionFileBuffer = Buffer.from(questionFileData, "base64");
        const questionWorkbook = XLSX.read(questionFileBuffer, { type: "buffer" });
        const questionSheetName = questionWorkbook.SheetNames[0];
        const questionData = XLSX.utils.sheet_to_json(questionWorkbook.Sheets[questionSheetName]);
//         const questionData = XLSX.utils.sheet_to_json(
//   questionWorkbook.Sheets[questionSheetName],
//   { defval: null } 
// );
        if (questionData.length === 0) {
            return res.status(400).json({ message: "Question file is empty." });
        }

        // Initialize studentData as empty array
        let studentData = [];
        const allowedStudents = [];
        const newStudents = [];

        if (studentFileData && studentFileData.trim() !== "") {
            const studentFileBuffer = Buffer.from(studentFileData, "base64");
            const studentWorkbook = XLSX.read(studentFileBuffer, { type: "buffer" });
            const studentSheetName = studentWorkbook.SheetNames[0];
            studentData = XLSX.utils.sheet_to_json(studentWorkbook.Sheets[studentSheetName]);

            for (let row of studentData) {
                const rollNumberKey = Object.keys(row)[0];
                const nameKey = Object.keys(row)[1];
                const emailKey = Object.keys(row)[2];

                if (!row[rollNumberKey] || !row[nameKey] || !row[emailKey]) continue;

                const rollNumber = String(row[rollNumberKey]).trim();
                const name = String(row[nameKey]).trim();
                const email = String(row[emailKey]).trim();

                allowedStudents.push(rollNumber);

                const studentRef = db.collection("studentDetails").doc(rollNumber);
                const studentDoc = await studentRef.get();

                if (!studentDoc.exists) {
                    const uniqueKey = Math.floor(1000 + Math.random() * 9000).toString();
                    await studentRef.set({ email, name, rollNumber, uniqueKey });
                    newStudents.push({ email, name, rollNumber, uniqueKey });
                }
            }
        }

        await db.collection("TestDetails").doc(testId).set({
            testTitle,
            testDuration,
            allowedStudents,
            createdAt: new Date(),
            adminEmail,
            isActive: false,
        });

       // Save questions
        const questionsCollection = db.collection(`${testId}Questions`);
        let questionNumber = 1;

        for (let row of questionData) {
            const question = row.question
  ? String(row.question).replace(/<br\s*\/?>/gi, '\n').trim()
  : null;
            const options = [
                row.option1 !== undefined ? String(row.option1).trim() : null,
                row.option2 !== undefined ? String(row.option2).trim() : null,
                row.option3 !== undefined ? String(row.option3).trim() : null,
                row.option4 !== undefined ? String(row.option4).trim() : null
            ].filter(option => option !== null && option !== ""); // Remove empty options

            const answer = row.answer !== undefined ? String(row.answer).trim() : "NA";

            // Handle marks: use 1 if marks field is missing, empty, or not a valid number
            let marks = 1;
            if (row.hasOwnProperty('marks') && row.marks !== "" && !isNaN(row.marks)) {
                marks = Number(row.marks);
            }

            const questionData = {
                question,
                options,
                answer,
                marks
            };

            // Handle image URL
            if (row.imageURL && String(row.imageURL).trim() !== "") {
                questionData.imageURL = row.imageURL;
            }

            await questionsCollection.doc(`question${questionNumber}`).set(questionData);
            questionNumber++;
        }

        
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
        return res.status(200).json({ message: "Test created successfully!", newStudents });
    } catch (error) {
        console.error("Error processing test:", error);
        return res.status(500).json({ message: "Error processing test", error: error.message });
    }
};


