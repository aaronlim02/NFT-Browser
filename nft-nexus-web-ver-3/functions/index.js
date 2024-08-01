/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
require("dotenv").config({path: path.resolve(__dirname, "../.env")});
const authenticateToken = require("./middleware/auth");
const winston = require("winston");
const admin = require('firebase-admin');
const fs = require('fs');

// Load the service account key (using dotenv)

const serviceAccount = JSON.parse(fs.readFileSync('./zzz/nft-nexus-5e707-firebase-adminsdk-to1ju-610903f6e9.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/*
// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});
*/

// Configure Winston logger + test
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: "logfile.log"}),
  ],
});
logger.info("hello world!");

const app = express();

// Configure CORS
app.use(cors({
  origin: 'https://nft-nexus-5e707.web.app', // Specify your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow headers
}));
// Handle preflight requests
app.options('*', cors());
// Use express.json() to parse JSON bodies
app.use(express.json());

const jwtSecretKey = process.env.JWT_SECRET;

/*
rant:

i spent entire days debugging the issue:

Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/login. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing). Status code: 403.

Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/login. (Reason: CORS request did not succeed). Status code: (null).

i have tried:

1. checking the urls
2. const express = require("express");
3. const cors = require("cors");
4. app.use(cors({
  origin: 'https://nft-nexus-5e707.web.app', // Specify the frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow headers
}));
5. app.options('*', cors());
6. app.use(express.json());
7. using curl to test the server
8. manually adding the headers in each of the endpoints
9. checking the network tab in inspect 
10. rebuilding this function over and over
11. Many more that ive done but probably forgot to mention here

however the CORS header ‘Access-Control-Allow-Origin’ is still missing when i check inspect>network everytime

The measures i taken should put the mentioned headers in the response headers but it doesnt.

at this point im very confused and exhausted

i guess this app won't have a login feature and consequently an account feature

there are still a few features that are still accessible without login, so please evaluate those

at this point i give up already
*/

// Register
app.post("/api/register", async (req, res) => {

  const { username, password } = req.body;
  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    // Check if the username already exists
    const userDoc = await db.collection('users').doc(username).get();
    if (userDoc.exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Insert the new user
    await db.collection('users').doc(username).set({
      password: hashedPassword,
      // Add other fields as needed
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {

  const { username, password } = req.body;
  try {
    const userDoc = await db.collection('users').doc(username).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcryptjs.compare(password, userDoc.data().password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: username }, jwtSecretKey, { expiresIn: "3h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete("/delete-user", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    await db.collection('users').doc(userId).delete();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve Account
app.get("/api/account", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const settingsDoc = await db.collection('settings').doc(userId).get();
    const settingsData = settingsDoc.exists ? settingsDoc.data() : {};

    res.status(200).json({
      username: userData.username,
      address: settingsData['wallet-address'],
      lightDarkMode: settingsData['light-dark-mode'] || 'light' // Default to 'light' if not found
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Personal Details
app.post('/settings/personal-details', authenticateToken, async (req, res) => {
  const { yourWalletAddress, lightDarkMode } = req.body;
  const userId = req.user.userId;

  try {
    await db.collection('settings').doc(userId).set({
      'wallet-address': yourWalletAddress,
      'light-dark-mode': lightDarkMode
    }, { merge: true }); // Use merge to update existing fields

    res.status(200).json({
      walletAddress: yourWalletAddress,
      lightDarkMode: lightDarkMode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
app.post('/settings/change-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId;

  try {
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await db.collection('users').doc(userId).update({ password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error, please try again later' });
  }
});

// watchlist //
// add to watchlist

// retrieve / edit / delete watchlist for account


// notifications //

// retrieve

// delete


// delete all


// galleries feature //
// crud galleries for account


// gallery view add delete


// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);