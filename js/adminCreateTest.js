let admin=sessionStorage.getItem("admin");
if(!admin){window.location.href = "\index.html";}

document.addEventListener("DOMContentLoaded", function () {
    generateTestID();
    emailjs.init("wk9qhm94B23_lBZWR");
});

async function generateTestID() {
        try {
            const response = await fetch('api/getTest', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminEmail: "admin@example.com" }) // Replace with actual admin email
            });
    
            const data = await response.json();
            
            // Ensure `data.tests` exists and is an array
            let testArray = Array.isArray(data.tests) ? data.tests : [];
    
            let existingTestNumbers = new Set();
            testArray.forEach(test => {
                let match = test.testId?.match(/Test(\d+)/);
                if (match) {
                    existingTestNumbers.add(parseInt(match[1], 10));
                }
            });
    
         
            let newTestNumber;
            do {
                newTestNumber = Math.floor(100 + Math.random() * 900); // Ensures 4-digit random ID
            } while (existingTestNumbers.has(newTestNumber)); // Regenerate if it exists
    
            let newTestId = "Test" + newTestNumber;
            document.getElementById("testId").value = newTestId;
    
        } catch (error) {
            console.error("Error fetching test details:", error);
        }
    }

document.getElementById("createTestForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const testId = document.getElementById("testId").value;
    const testTitle = document.getElementById("testTitle").value.trim();
    const testDuration = document.getElementById("testDuration").value.trim();
    const questionFile = document.getElementById("questionFile").files[0];
    const studentFile = document.getElementById("studentFile").files[0];
    const adminEmail=sessionStorage.getItem("adminEmail");
    if (!questionFile || !studentFile) {
        alert("Please upload both Question and Student files.");
        return;
    }

    if (!questionFile.name.match(/\.(xlsx|xls)$/) || !studentFile.name.match(/\.(xlsx|xls)$/)) {
        alert("Invalid file format. Only Excel files are allowed.");
        return;
    }

    loader.style.display = "flex";
    spinner.style.display = "block";

    // Read both files as Base64
    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(",")[1]); // Remove the prefix
            reader.onerror = (error) => reject(error);
        });
    };

    try {
        const questionFileBase64 = await readFileAsBase64(questionFile);
        const studentFileBase64 = await readFileAsBase64(studentFile);

        const payload = {
            testId: testId,
            testTitle: testTitle,
            testDuration: testDuration,
            questionFileData: questionFileBase64,
            questionFileName: questionFile.name,
            studentFileData: studentFileBase64,
            studentFileName: studentFile.name,
            adminEmail:adminEmail
        };

        const response = await fetch("api/adminCreateTest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            mode: "cors",
        });

        const result = await response.json();
        if (response.ok) {
            
            console.log(result.newStudents);
            if (result.newStudents.length > 0) {
                await sendEmailsToStudents(result.newStudents);
            }
            alert("Test created successfully!");
            window.location.reload();
            // document.getElementById("createTestForm").reset();
            
        } else {
            alert(result.message || "Error creating test.");
        }
    } catch (error) {
        console.error("Error processing files:", error);
        alert("Error processing files.");
    } finally {
        loader.style.display = "none";
        spinner.style.display = "none";
    }
});

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
