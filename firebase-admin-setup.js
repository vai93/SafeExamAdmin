const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: "https://141862631065.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
