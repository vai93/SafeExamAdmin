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
    if (!questionFile ) {
        alert("Please upload Question file.");
        return;
    }

    if (!questionFile.name.match(/\.(xlsx|xls)$/) ) {
        alert("Invalid file format. Only Excel files are allowed.");
        return;
    }
    if (studentFile ) {
    if (!studentFile.name.match(/\.(xlsx|xls)$/) ) {
        alert("Invalid file format. Only Excel files are allowed.");
        return;
    }}

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
        let studentFileBase64 = "";
        let studentFileName = "";

    if (studentFile && studentFile instanceof Blob) {
        studentFileBase64 = await readFileAsBase64(studentFile);
        studentFileName = studentFile.name;
    }

        const payload = {
            testId: testId,
            testTitle: testTitle,
            testDuration: testDuration,
            questionFileData: questionFileBase64,
            questionFileName: questionFile.name,
            studentFileData: studentFileBase64,
            studentFileName: studentFileName,
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
             if (result.newStudents.length > 0) {
                await notificationSuperAdmin();
            }
            const message = `Test created successfully ✅`;
            alert(message); 
            window.location.reload();
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
