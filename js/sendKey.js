import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { db ,signInUser } from "./firebase.js";
const studentdb="StudentDetails2022";
const excludedEmails = [
   
];

// Function to introduce delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMailToAll() {
    try {
        // Fetch all documents in the "StudentDetails" collection
        const studentsCollection = collection(db, studentdb);
        const studentsSnapshot = await getDocs(studentsCollection);

        if (studentsSnapshot.empty) {
            console.log("No students found in the collection!");
            alert("No students found!");
            return;
        }

        let index = 0;

        // Convert snapshot to an array
        const studentsArray = studentsSnapshot.docs.map(doc => doc.data());

        for (const studentData of studentsArray) {
            const email = studentData.email;
            const uniqueKey = studentData.uniqueKey;
            const rollnumber = studentData.rollNumber;

            // console.log(`Sending email to: ${rollnumber}, Unique Key: ${uniqueKey}`);
            if (excludedEmails.includes(email)) {
                console.log(`Skipping email to ${email}`);
                continue;
            }
            // Prepare template parameters
            const templateParams = {
                to_email: email,
                subject: "Your Unique Key for the Exam",
                rollnumber: `${rollnumber} `,
                uniqueKey: `${uniqueKey} `
            };

            try {
                await emailjs.send("service_z3kkqtd", "template_715wyrd", templateParams);
                console.log(`Email sent successfully to ${email}`);
            } catch (error) {
                console.error(`Error sending email to ${email}`, error);
            }

            // Wait 1 second before sending the next email
            if (index < studentsArray.length - 1) {
                await delay(1000);
            }
            index++;
        }

        alert("Emails have been sent to all students!");
    } catch (error) {
        console.error("Error fetching student data", error);
        alert("There was an error fetching student data.");
    }
}


document.getElementById("btn1").addEventListener("click", async () => {
    await signInUser(); // Ensure the user is signed in first
    sendMailToAll();
  });
  