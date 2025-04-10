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
        const { testId, testTitle, testDuration, questionFileData, studentFileData,adminEmail } = req.body;

        if (!questionFileData || !studentFileData) {
            return res.status(400).json({ message: "Both question and student files are required" });
        }

        // Convert Base64 back to Buffer
        const questionFileBuffer = Buffer.from(questionFileData, "base64");
        const studentFileBuffer = Buffer.from(studentFileData, "base64");

        // Process Excel files
        const questionWorkbook = XLSX.read(questionFileBuffer, { type: "buffer" });
        const studentWorkbook = XLSX.read(studentFileBuffer, { type: "buffer" });

        const questionSheetName = questionWorkbook.SheetNames[0];
        const studentSheetName = studentWorkbook.SheetNames[0];

        const questionData = XLSX.utils.sheet_to_json(questionWorkbook.Sheets[questionSheetName]);
        const studentData = XLSX.utils.sheet_to_json(studentWorkbook.Sheets[studentSheetName]);

        if (questionData.length === 0 || studentData.length === 0) {
            return res.status(400).json({ message: "Uploaded files are empty." });
        }

        // Extract student details (Roll Number, Name, Email)
        const allowedStudents = [];
        const newStudents = [];

        for (let row of studentData) {
            const rollNumberKey = Object.keys(row)[0]; // First column (Roll Number)
            const nameKey = Object.keys(row)[1]; // Second column (Name)
            const emailKey = Object.keys(row)[2]; // Third column (Email)

            if (!row[rollNumberKey] || !row[nameKey] || !row[emailKey]) continue; // Skip incomplete rows

            const rollNumber = String(row[rollNumberKey]).trim();
            const name = String(row[nameKey]).trim();
            const email = String(row[emailKey]).trim();

            allowedStudents.push(rollNumber);

            // Check if student already exists in StudentDetails
            const studentRef = db.collection("studentDetails").doc(rollNumber);
            const studentDoc = await studentRef.get();

            if (!studentDoc.exists) {
                const uniqueKey = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit key
                
                await studentRef.set({
                    email,name,rollNumber, uniqueKey
                });

                newStudents.push({ email,name,rollNumber, uniqueKey });
            }
        }

        // Save test details including allowed students
        await db.collection("TestDetails").doc(testId).set({
            testTitle,
            testDuration,
            allowedStudents, // Store allowed students array
            createdAt: new Date(),
            adminEmail,
            isActive:false,
        });

        // Save questions
        const questionsCollection = db.collection(`${testId}Questions`);
        let questionNumber = 1;
        
        for (let row of questionData) {
            const question = row.question ? String(row.question).trim() : null;
            const options = [
                row.option1 !== undefined ? String(row.option1).trim() : null,
                row.option2 !== undefined ? String(row.option2).trim() : null,
                row.option3 !== undefined ? String(row.option3).trim() : null,
                row.option4 !== undefined ? String(row.option4).trim() : null
            ].filter(option => option !== null && option !== ""); // Remove empty options

            const answer = row.answer !== undefined ? String(row.answer).trim() : "NA";
            
            const questionData = {
                question,
                options,
                answer
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


