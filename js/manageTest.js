let admin = sessionStorage.getItem("admin");
let adminEmail = sessionStorage.getItem("adminEmail");

if (!admin || !adminEmail) {
    window.location.href = "index.html";  // Redirect if not logged in
}
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("wk9qhm94B23_lBZWR");
});

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
            testList.innerHTML = ""; // Clear previous content
            if (data.tests.length > 0) {
                noTestsMessage.style.display = "none";
                data.tests.forEach((test) => {
                    const examItem = document.createElement("li");
                    examItem.classList.add("list-group-item", "exam-item");
                    examItem.textContent = `${test.docID} - ${test.testTitle}`;
                    examItem.dataset.docid = test.docID;
                    examItem.dataset.title = test.testTitle;
                    examItem.dataset.duration = test.testDuration;
                    testList.appendChild(examItem);
                });
            } else {
                noTestsMessage.innerHTML = `
                    <p>No tests available.</p>
                    <a href="createTest.html" class="btn btn-success">Create Test</a>
                `;
            }
        } else {
            noTestsMessage.innerHTML = "<p>Error fetching tests.</p>";
        }
    } catch (error) {
        console.error("Error fetching tests:", error);
        noTestsMessage.innerHTML = "<p>Error loading tests.</p>";
    }
});
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("exam-item")) {
        showExamOptions(
            event.target.dataset.docid,
            event.target.dataset.title,
            event.target.dataset.duration
        );
    }
});
function showExamOptions(testId, testTitle, duration) {
    sessionStorage.setItem("testId",testId);
    document.getElementById("examOptions").style.display = "block";
    document.getElementById("examDuration").innerHTML=`Duration: ${duration} minutes`;
    document.getElementById("examTitle").innerText = `${testId} - ${testTitle} `;
    document.getElementById("examDuration").innerText = `Duration: ${duration} mins`;
}


function showUpdateFormQuestions() {
    const updateSection = document.getElementById("updateSection");
    const updateSectionTitle = document.getElementById("updateSectionTitle");
    document.getElementById("sampleFileLink").href = "/sample_questions.xlsx";
    updateSection.style.display = "block";
    updateSectionTitle.innerText = "Update Questions";
    document.getElementById("updateFile").setAttribute("data-update-type", "Questions");
}

function showUpdateFormStudents() {
    const updateSection = document.getElementById("updateSection");
    const updateSectionTitle = document.getElementById("updateSectionTitle");
    document.getElementById("sampleFileLink").href = "/sample_students.xlsx";
    updateSection.style.display = "block";
    updateSectionTitle.innerText = "Update Student List";
    document.getElementById("updateFile").setAttribute("data-update-type", "Students");
}


function deleteResponses() {
    testId=sessionStorage.getItem("testId");
    if (confirm("Are you sure you want to delete all responses? This action cannot be undone.")) {
        fetch("api/deleteResponses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error));
    }
}

function deleteTest() {
    const testId = sessionStorage.getItem("testId");
    const confirmation = confirm("Are you sure you want to delete this test? This will remove all questions as well as responses permanently.");
    
    if (!confirmation) return;

    fetch("http://localhost:3000/api/deleteTest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            sessionStorage.removeItem("testId");
            window.location.reload(); // Reload page after deletion
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error deleting the test.");
    });
}

async function submitUpdate() {
    testId=sessionStorage.getItem("testId");
    const fileInput = document.getElementById("updateFile");
    const file = fileInput.files[0];
    const updateType = fileInput.getAttribute("data-update-type");

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async function () {
        const base64Data = reader.result.split(",")[1];

        try {
            const response = await fetch(`api/update${updateType}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testId, fileData: base64Data })
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok ){
                if(result.newStudents){
                    if(result.newStudents.length > 0) {
                sendEmailsToStudents(result.newStudents);
            }}}
        } catch (error) {
            console.error("Error:", error);
            alert("Error updating student list.");
        }
    };
}

function sendEmailsToStudents(students) {
    let failedEmails = [];

    students.forEach(student => {
        const templateParams = {
            to_email: student.email,
            subject: "Your Unique Key for the Exam",
            rollnumber: student.rollNumber,
            uniqueKey: student.uniqueKey
        };

        emailjs.send("service_fiyiagk", "template_fdt3ewg", templateParams)
            .then(response => {
                console.log(`Email sent to ${student.email}:`, response);
            })
            .catch(error => {
                failedEmails.push(student);
                console.error(`Error sending email to ${student.email}:`, error);
            })
            .finally(async () => {
                if (failedEmails.length > 0) {
                    alert(`Error: Emails were not sent to ${failedEmails.length} students. Please contact the admin.`);
                    
                    try {
                        for (const student of failedEmails) {
                            await storeFailedEmail(student);
                        }
                    } catch (error) {
                        console.error("Error storing failed emails:", error);
                    }
                }
            });
    });
}

async function storeFailedEmail(student) {
    try {
        const response = await fetch("api/storeFailedEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber,
                uniqueKey: student.uniqueKey
            })
        });

        const data = await response.json();
        console.log("Failed email stored:", data);
    } catch (error) {
        console.error("Error calling storeFailedEmail API:", error);
    }
}







function updateTestTitle() {
    testId=sessionStorage.getItem("testId");
    const newTitle = prompt("Enter new test title:");
    if (newTitle) {
        fetch("api/updateTestTitle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId, testTitle: newTitle })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error));
    }
}

function updateTestDuration() {
    testId=sessionStorage.getItem("testId");
    const newDuration = prompt("Enter new test duration (in minutes):");
    if (newDuration) {
        fetch("api/updateTestDuration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId, testDuration: newDuration })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error));
    }
}
