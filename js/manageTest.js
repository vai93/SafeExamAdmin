let admin = sessionStorage.getItem("admin");
let adminEmail = sessionStorage.getItem("adminEmail");

if (!admin || !adminEmail) {
    window.location.href = "index.html";  // Redirect if not logged in
}
document.addEventListener("DOMContentLoaded", async function () {
     emailjs.init("wk9qhm94B23_lBZWR");
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
    showLoader();
    const testId=sessionStorage.getItem("testId");
    if (confirm("Are you sure you want to delete all responses? This action cannot be undone.")) {
        fetch("api/deleteResponses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error))
        .finally(() => {
            hideLoader();
        });
    } else {
        hideLoader(); // Hide loader if user cancels deletion
    }
    }

function deleteTest() {
    showLoader();
    const testId = sessionStorage.getItem("testId");
    const confirmation = confirm("Are you sure you want to delete this test? This will remove all questions as well as responses permanently.");
    
    if (!confirmation) {
        hideLoader(); // Hide loader if user cancels deletion
        return;
    }

    fetch("api/deleteTest", {
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
    })
    .finally(() => {
            hideLoader();
        });
    } 
    


async function submitUpdate() {
    showLoader();
    const testId=sessionStorage.getItem("testId");
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
                        await notificationSuperAdmin();
            }}}
        } catch (error) {
            console.error("Error:", error);
            alert("Error updating student list.");
        }finally {
        hideLoader();
    }
    };
}

function notificationSuperAdmin(){
    let admin = sessionStorage.getItem("admin");
    const templateParams = {
        to_email: "vaibhavik@nuv.ac.in",
        subject: "New students registered",
        admin:admin
    };

    emailjs.send("service_fiyiagk", "template_dzd78vi", templateParams)
        .then(response => {
            console.log("Email sent successfully:", response);
        })
        .catch(error => {
            console.error("Error sending email:", error);
        });
}

function updateTestTitle() {
    showLoader();
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
        .catch(error => console.error("Error:", error))
        .finally(() => {
            hideLoader();
        });
    }
}

function updateTestDuration() {
    const testId=sessionStorage.getItem("testId");
    const newDuration = prompt("Enter new test duration (in minutes):");
    if (newDuration) {
        showLoader();
        fetch("api/updateTestDuration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId, testDuration: newDuration })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error("Error:", error))
        .finally(() => {
            hideLoader();
             window.location.reload();
        });
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
 createLoader();
function showLoader() {
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    }
}
