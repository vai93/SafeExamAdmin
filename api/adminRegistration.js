const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { db } = require("../firebase-admin-setup");

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
        const userDoc = await db.collection("adminDetails").doc(nuvID).get();

        if (userDoc.exists) {
            return res.status(400).json({ message: "Email already registered. Try logging in instead." });
        }

        // Save user details to Firestore
        await db.collection("adminDetails").doc(nuvID).set({
            name,
            email: nuvID,
            password: password,
            emailVerified: true,
        });

        // ✅ Gmail SMTP Configuration
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "vkpatel93@gmail.com", // Gmail Account
                pass: "waue kybv fjka qfzq", // App Password (must be valid)
            },
        });

        // ✅ Email to Super Admin
        const adminMailOptions = {
            from: "vkpatel93@gmail.com",
            to: "vaibhavik@nuv.ac.in",
            subject: "New Admin Registration",
            html: `<p>A new Admin account has been registered.</p>
                   <p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email ID:</strong> ${nuvID}</p>`,
        };

        // ✅ Email to New Admin (nuvID)
        const userMailOptions = {
            from: "vkpatel93@gmail.com",
            to: nuvID, // New Admin Email
            subject: "Account Successfully Created on Safe-Exam Portal",
            html: `<p>Dear ${name},</p>
                   <p>Your account has been successfully created on the Safe-Exam Portal.</p>
                   <p>You can now create and manage your online tests.</p><br><br>
                   <p>Best regards,<br>Vaibhavi</p>`,
        };

        // ✅ Send both emails
        await transporter.sendMail(adminMailOptions);
        console.log("✅ Super Admin notification sent.");

        await transporter.sendMail(userMailOptions);
        console.log("✅ New Admin confirmation email sent.");

        res.status(200).json({ message: "Registration successful!", email: nuvID, name: name });
    } catch (error) {
        console.error("🚨 Error sending email:", error);
        if (error.response) {
            console.error("📩 SMTP Response:", error.response);
        }
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};
