const { db } = require("../firebase-admin-setup");
require('dotenv').config();

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

    try {
        const { testId } = req.body;
        if (!testId) {
            return res.status(400).json({ message: "Missing testId" });
        }

        // 🔹 1. Delete Questions
        const questionsCollection = db.collection(`${testId}Questions`);
        await questionsCollection.listDocuments().then(docs => docs.forEach(doc => doc.delete()));

        // 🔹 2. Delete Responses
        const responsesCollection = db.collection(`${testId}StudentResponses`);
        await responsesCollection.listDocuments().then(docs => docs.forEach(doc => doc.delete()));

        // 🔹 3. Delete Test Details
        await db.collection("TestDetails").doc(testId).delete();

        // 🔹 4. Delete GitHub Files (One by One)
        const { Octokit } = await import("@octokit/rest"); // Use dynamic import
         const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = "vai93";
        const repo = "SafeExam";
        const folderPath = `${testId}`; // No trailing slash
        const commitMessage = `Added deleted file for ${testId}`;
        try {
            console.log(`Checking GitHub folder: ${folderPath}`);
            const { data: files } = await octokit.rest.repos.getContent({ owner, repo, path: folderPath });
            if (!Array.isArray(files) || files.length === 0) {
                console.log(`No files found in '${testId}', nothing to delete.`);
            } else {
                for (const file of files) {
                    console.log(`Deleting: ${file.path}`);
                    await octokit.rest.repos.deleteFile({
                        owner,
                        repo,
                        path: file.path, // Correct path for each file
                        message: `Deleted test file ${file.path}`,
                        committer: { name: "Vaibhavi Patel", email: "vkpatel93@gmail.com" },
                        author: { name: "Vaibhavi Patel", email: "vkpatel93@gmail.com" },
                        sha: file.sha, // Correct SHA for each file
                    });

                    console.log(`✅ Deleted: ${file.path}`);
                }
            }

            console.log(`✅ Successfully deleted all files for '${testId}'. Folder will be removed automatically.`);
        } catch (error) {
            if (error.status === 404) {
                console.log(`❌ No files found for '${testId}', folder does not exist.`);
            } else {
                console.error("❌ Error deleting test directory:", error);
            }
        }

        return res.json({ success: true, message: "Test and related data deleted successfully." });

    } catch (error) {
        console.error("❌ Error deleting test:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
