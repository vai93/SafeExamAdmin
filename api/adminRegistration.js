const { db } = require("../firebase-admin-setup");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { name, nuvID, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match!" });
    }

    try {

        // const userRecord = await admin.auth().createUser({
        //     email: nuvID,
        //     password: password,
        //     displayName: name,
        //     emailVerified: false, // Not verified yet
        // });

        const userDoc = await db.collection("adminDetails").doc(nuvID).get();

        if (userDoc.exists) {
            return res.status(400).json({ message: "Email already registered. Try logging in instead." });
        }
        // Save to Firestore
        await db.collection("adminDetails").doc(nuvID).set({
            name,
            email: nuvID,
            password: password,
            emailVerified: false, // Store verification status
        });
         // Send Verification Email to the New Admin
        //  await sendVerificationEmail(userRecord.email);

        // Notify the Super Admin about the new registration
        // await notifySuperAdmin(name, nuvID);

       

        
        res.status(200).json({ message: "Registration successful! Please contact to the administrator for verification." });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

// Function to send email verification to the new admin
async function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: `https://safe-exam-admin-nuv.vercel.app/verify-email?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
    };

    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    console.log("Generated verification link:", link); 
    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Verify Your Email - Super Admin",
        html: `<p>Click the link below to verify your email:</p>
               <p><a href="${link}">${link}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
}

// Function to notify the Super Admin about the new registration
async function notifySuperAdmin(name, nuvID) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: "vkpatel93@gmail.com", // Super Admin's email
        subject: "New Super Admin Registration",
        html: `<p>A new Super Admin account has been registered.</p>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email ID:</strong> ${nuvID}</p>
               <p>The admin needs to verify their email before activation.</p>`,
    };

    await transporter.sendMail(mailOptions);
}
