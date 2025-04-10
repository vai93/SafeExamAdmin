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
        const response = await fetch("api/getTest", {
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
                    const testURL = `https://safe-exam.vercel.app/${test.docID}`;
                    listItem.innerHTML = `
                        <span>${test.docID} - ${test.testTitle}</span>
                        <span>
                            <button class="btn btn-sm ${test.isActive ? 'btn-danger' : 'btn-success'} toggle-btn" 
                                data-id="${test.docID}" 
                                data-active="${test.isActive}">
                                ${test.isActive ? 'Stop Test' : 'Start Test'}
                            </button>
                            <a class="btn btn-sm btn-warning download-btn"data-id="${test.docID}">Download Responses</a>
                       <button class="btn btn-sm btn-info preview-btn" 
                            data-id="${test.docID}" 
                            data-title="${test.testTitle}" 
                            data-duration="${test.testDuration}">
                            Preview
                        </button>
                        </span>
                    `;

                    testList.appendChild(listItem);
                });

                  // document.querySelectorAll(".preview-btn").forEach((button) => {
                //     button.addEventListener("click", function () {
                //         const testId = this.getAttribute("data-id");
                //         const testTitle = this.getAttribute("data-title") || "";
                //         const testDuration = this.getAttribute("data-duration") || "";
                //         const adminName = sessionStorage.getItem("admin") || "Admin";
                
                //         // Set cookie for validStudent
                //         document.cookie = `validStudent=true; path=/; max-age=3600`;
                
                //         // Create hidden form
                //         const form = document.createElement("form");
                //         form.method = "POST";
                //         form.action = `https://safe-exam.vercel.app/mcq.html`;
                //         form.target = "_blank";
                
                //         const inputs = [
                //             { name: "testId", value: testId },
                //             { name: "rollNumber", value: "1" },
                //             { name: "name", value: adminName },
                //             { name: "testTitle", value: testTitle },
                //             { name: "testDuration", value: testDuration },
                //         ];
                
                //         inputs.forEach(input => {
                //             const field = document.createElement("input");
                //             field.type = "hidden";
                //             field.name = input.name;
                //             field.value = input.value;
                //             form.appendChild(field);
                //         });
                
                //         document.body.appendChild(form);
                //         form.submit();
                //         document.body.removeChild(form);
                //     });
                // });
                document.querySelectorAll(".preview-btn").forEach((button) => {
                    button.addEventListener("click", function () {
                        const testId = this.getAttribute("data-id");
                        const testTitle = encodeURIComponent(this.getAttribute("data-title"));
                        const testDuration = encodeURIComponent(this.getAttribute("data-duration"));
                        const adminName = encodeURIComponent(sessionStorage.getItem("admin") || "Admin");
                
                        // Set cookie for student validation
                        document.cookie = `validStudent=true; path=/; max-age=3600`;
                
                        // Construct URL with query parameters
                        const url = `https://safe-exam.vercel.app/mcq.html?testId=${testId}&rollNumber=1&name=${adminName}&testTitle=${testTitle}&testDuration=${testDuration}`;
                
                        // Open in new tab
                        window.open(url, "_blank");
                    });
                });

                document.querySelectorAll(".download-btn").forEach((button) => {
                    button.addEventListener("click", async function () {
                         showLoader();
                        const testId = this.getAttribute("data-id");
                        console.log("clicked");
                        console.log(testId);
                        downloadResponses(testId);
                    });
                });

                document.querySelectorAll(".toggle-btn").forEach((button) => {
                    button.addEventListener("click", async function () {
                         showLoader();
                        const testId = this.getAttribute("data-id");
                        const isActive = this.getAttribute("data-active") === "true"; // Convert string to boolean

                        try {
                            const response = await fetch("api/toggleTestStatus", {
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
                        }finally {
                            hideLoader();
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
        const response = await fetch("api/getResponses", {
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
                ipAddress: response.ip || "NA",
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
    }finally {
        hideLoader();
    }
}
function createLoader() {
    if (!document.getElementById("loader")) {
        const loaderDiv = document.createElement("div");
        loaderDiv.id = "loader";
        loaderDiv.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-size: 20px;
            font-weight: bold;
            color: #333;
        `;
        loaderDiv.innerHTML = `
            Processing... Please wait.
            <div id="spinner" style="
                border: 8px solid #6bf3ac;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
                margin-top: 10px;
            "></div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loaderDiv);
    }
}

function showLoader() {
    createLoader();
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    }
}

