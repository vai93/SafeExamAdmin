let admin = sessionStorage.getItem("admin");
let adminEmail = sessionStorage.getItem("adminEmail");

if (!admin || !adminEmail) {
    window.location.href = "index.html";  // Redirect if not logged in
}

document.getElementById("admin").innerHTML = "Welcome, " + admin;

document.addEventListener("DOMContentLoaded", async function () {
    const testList = document.getElementById("testList");
    const noTestsMessage = document.getElementById("noTestsMessage");
    noTestsMessage.innerHTML = "<p>Loading tests...</p>";
    noTestsMessage.style.display = "block";
    try {
        const response = await fetch("http://localhost:3000/api/getTest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminEmail }),
        });

        const data = await response.json();

        if (response.ok) {
            const tests = data.tests;
            if (tests.length > 0) {
                noTestsMessage.style.display = "none";

                tests.forEach((test) => {
                    let listItem = document.createElement("li");
                    listItem.className = "list-group-item d-flex justify-content-between align-items-center";

                    listItem.innerHTML = `
                        <span>${test.docID} - ${test.testTitle}</span>
                        <span>
                            <button class="btn btn-sm ${test.isActive ? 'btn-danger' : 'btn-success'} toggle-btn" 
                                data-id="${test.docID}" 
                                data-active="${test.isActive}">
                                ${test.isActive ? 'Stop Test' : 'Start Test'}
                            </button>
                            <a class="btn btn-sm btn-warning download-btn"data-id="${test.docID}">Download Responses</a>
                        </span>
                    `;

                    testList.appendChild(listItem);
                });

                document.querySelectorAll(".download-btn").forEach((button) => {
                    button.addEventListener("click", async function () {
                        const testId = this.getAttribute("data-id");
                        console.log("clicked");
                        console.log(testId);
                        downloadResponses(testId);
                    });
                });

                document.querySelectorAll(".toggle-btn").forEach((button) => {
                    button.addEventListener("click", async function () {
                        const testId = this.getAttribute("data-id");
                        const isActive = this.getAttribute("data-active") === "true"; // Convert string to boolean

                        try {
                            const response = await fetch("http://localhost:3000/api/toggleTestStatus", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ testId, isActive: !isActive }), // Toggle the status
                            });

                            const data = await response.json();
                            alert(data.message);

                            // Update UI button state
                            this.classList.toggle("btn-success", isActive);
                            this.classList.toggle("btn-danger", !isActive);
                            this.textContent = isActive ? "Start Test" : "Stop Test";
                            this.setAttribute("data-active", (!isActive).toString()); // Update attribute

                        } catch (error) {
                            console.error("Error toggling test:", error);
                            alert("Failed to toggle test status.");
                        }
                    });
                });
            } else {
                noTestsMessage.innerHTML = `
                    <p>No tests available.</p>
                    <a href="createTest.html" class="btn btn-success">Create Test</a>
                `;
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error fetching tests:", error);
        noTestsMessage.innerHTML = "Error loading tests.";
        noTestsMessage.style.display = "block";
    }
});


async function downloadResponses(testId) {
    try {
        const response = await fetch("http://localhost:3000/api/getResponses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ responsedb: `${testId}StudentResponses` }),
        });

        const data = await response.json();

        if (!response.ok || !data.responses || data.responses.length === 0) {
            alert("No quiz results found to export.");
            return;
        }

        const responses = data.responses;
        let maxQuestions = 0;

        // Find the max number of questions
        responses.forEach((response) => {
            const numQuestions = Object.keys(response.answers || {}).length;
            if (numQuestions > maxQuestions) {
                maxQuestions = numQuestions;
            }
        });

        // Build the response data
        const formattedResponses = responses.map((response) => {
            let row = {
                RollNumber: response.rollNumber || "NA",
                Name: response.studentName || "NA",
                Score: response.score || 0,
                SubmittedAt: response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "NA",
                Violation: response.violation || "NA",
            };

            // Populate questions in sequence (Q1, Q2, ..., Qn)
            for (let i = 1; i <= maxQuestions; i++) {
                row[`Q${i}`] = response.answers?.[`question${i}`] || "NA";
            }
            return row;
        });

        // Convert the data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(formattedResponses);

        // Create a workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Results");

        // Export the workbook as an Excel file
        XLSX.writeFile(workbook, `Quiz_Results_${testId}.xlsx`);
        alert("Quiz results exported successfully!");

    } catch (error) {
        console.error("Error exporting quiz results:", error);
        alert("An error occurred while exporting quiz results.");
    }
}

