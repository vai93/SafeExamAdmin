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
        
        const { Octokit } = await import("@octokit/rest"); // Use dynamic import
        // const octokit = new Octokit({ auth: "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"});
         const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = "vai93";
        const repo = "SafeExam";
        const filePath = `${testId}/index.html`;
        const commitMessage = `Added test file for ${testId}`;

        const htmlContent = `
     <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${testTitle}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/styleIndex.css">
</head>
<body>
    <div id="root" class="min-h-screen theme-blue p-6 relative transition-colors duration-300">
        <div class="max-w-4xl mx-auto pt-16 flex flex-col items-center gap-8" style="margin-top:-45px">
            <h1 class="text-4xl font-bold text-center title">
                Welcome to the ${testTitle}</h1>
             <div class="card w-full max-w-2xl">
                <div class="card-header">
                    <h2 class="card-title">Instructions</h2>
                </div>
                <div class="card-content">
                    <ul>
                        <li>Switching tabs, windows, or minimizing the fullscreen is strictly prohibited. 
                            In such cases, the quiz will be <b>automatically submitted</b>.</li> 
                        <li>If multiple responses are found, the <b>first response </b>will be considered the <b>final</b> score.</li>
                        <li>You can see the timer in the top to track your progress.</li>
                        <li>Once you start the quiz, you cannot pause or restart it.</li>
                        <li>Make sure you have opened your exam in Chrome/Edge for smooth conduction.</li>
                    </ul>
                </div>
            </div>
             <div class="card w-full max-w-2xl">
            <form id="quizForm">
                <div class="mb-3">
                    <label for="RollNumber" class="form-label">RollNumber</label>
                    <input type="text" class="form-control" id="rollNumber" name="rollNumber"required>
                  </div>
                  <div class="mb-3">
                    <label for="uniqueKey" class="form-label">Unique Key</label>
                    <input type="text" class="form-control" id="uniqueKey" name="uniqueKey" required>
                </div>
                
                <center>
                <button type="submit" class="button button-primary button-large">
                    Login
                </button></center>
              </form>
            </div>
    
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/lucide.min.js"></script>
    <footer style="background: linear-gradient(180deg, rgb(240, 247, 255) 0%, rgb(255, 255, 255) 100%); color: #333; margin-top: 100px; padding: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;margin-top:50px;padding-top:50px; padding: 0 20px;">
            <p class="fcontent">© 2025 NUV Group, All rights reserved.</p>
            <p class="fcontent"style="text-align: right;">Designed & Developed By Vaibhavi Patel</p>
        </div>
    </footer>
    
     <script>sessionStorage.setItem("testId", "${testId}");</script>
<script type="module"src="js/validation.js"></script>
</body>
</html>
    `;
     try {
            let sha = null;
            try {
                const { data } = await octokit.rest.repos.getContent({ owner, repo, path: filePath });
                sha = data.sha;
            } catch (err) {
                console.log("File does not exist, creating new one.");
            }

            await octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: filePath,
                message: commitMessage,
                content: Buffer.from(htmlContent).toString("base64"),
                committer: { name: "Vaibhavi Patel", email: "vkpatel93@gmail.com" },
                author: { name: "Vaibhavi Patel", email: "vkpatel93@gmail.com" },
                sha: sha || undefined,
            });

            console.log(`Test HTML file uploaded to GitHub: ${filePath}`);
        } catch (error) {
            console.error("GitHub Upload Error:", error);
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


