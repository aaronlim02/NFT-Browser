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
const { Database } = require('@sqlitecloud/drivers');

// Load the service account key (using dotenv)

const serviceAccount = JSON.parse(fs.readFileSync('./zzz/nft-nexus-5e707-firebase-adminsdk-to1ju-610903f6e9.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//const db = admin.firestore();

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
const db = new Database('sqlitecloud://cqjrg3d9ik.sqlite.cloud:8860?apikey=zabyXKNXskraNAGE2Af86sowyOyHGz76mym0lMCyRTo')
db.exec('USE DATABASE database.sqlite;');

// Configure Winston logger + test
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: "logfile.log"}),
  ],
});
logger.info("hello world! this is v3");

const app = express();

// Configure CORS
app.use(cors({
  origin: 'https://nft-nexus-5e707.web.app', // Specify your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
  credentials: true
}));
// Handle preflight requests
app.options('*', cors());
// Use express.json() to parse JSON bodies
app.use(express.json());

const jwtSecretKey = "6d4aecdc4712722d9ac57da9aaad537605979369d40a68a27539b21007aa3d42";

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    // Check if the username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        // Username already exists
        return res.status(409).json({ error: 'User already exists' });
      }

      // Insert the new user
      const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      const params = [username, hashedPassword];

      db.run(sql, params, function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: err.message });
        }

        // Get the inserted user
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(user);
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, jwtSecretKey, { expiresIn: '3h' });
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/delete-user', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware

  try {
    // Delete the user from the database
    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Confirm deletion
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/process-data', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    // Make a POST request to the Flask app
    const response = await axios.post('http://localhost:5001/process', data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// retrieve account stuff
app.get('/api/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // id in users
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    const walletQuery = 'SELECT * FROM settings WHERE user_id = ? AND setting_key = "wallet-address"';
    const themeQuery = 'SELECT * FROM settings WHERE user_id = ? AND setting_key = "light-dark-mode"';

    const getUser = () => new Promise((resolve, reject) => {
      db.get(userQuery, [userId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    const getWallet = () => new Promise((resolve, reject) => {
      db.get(walletQuery, [userId], (err, row) => {
        if (err) reject(err);
        resolve(row ? row.setting_value : null);
      });
    });

    const getTheme = () => new Promise((resolve, reject) => {
      db.get(themeQuery, [userId], (err, row) => {
        if (err) reject(err);
        resolve(row ? row.setting_value : 'light');
      });
    });

    const [user, address, lightDarkMode] = await Promise.all([getUser(), getWallet(), getTheme()]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ username: user.username, address, lightDarkMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/settings/personal-details', authenticateToken, async (req, res) => {
  const { yourWalletAddress, lightDarkMode } = req.body;
  const userId = req.user.userId;

  const updateOrInsertSetting = (key, value) => new Promise((resolve, reject) => {
    db.get('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, key], (err, row) => {
      if (err) return reject(err);

      if (value.length == 0) {
        return resolve();
      }

      if (row) {
        db.run('UPDATE settings SET setting_value = ? WHERE user_id = ? AND setting_key = ?', [value, userId, key], function (err) {
          if (err) reject(err);
          resolve();
        });
      } else {
        db.run('INSERT INTO settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)', [userId, key, value], function (err) {
          if (err) reject(err);
          resolve();
        });
      }
    });
  });

  try {
    await Promise.all([
      updateOrInsertSetting('wallet-address', yourWalletAddress),
      updateOrInsertSetting('light-dark-mode', lightDarkMode)
    ]);

    const fetchUpdatedSettings = () => new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings WHERE user_id = ? AND setting_key IN ("wallet-address", "light-dark-mode")', [userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const updatedRows = await fetchUpdatedSettings();
    const response = {
      walletAddress: null,
      lightDarkMode: null
    };

    updatedRows.forEach(row => {
      if (row.setting_key === 'wallet-address') {
        response.walletAddress = row.setting_value;
      } else if (row.setting_key === 'light-dark-mode') {
        response.lightDarkMode = row.setting_value;
      }
    });

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/settings/change-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId;

  try {
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Server error, please try again later' });
      }
      return res.status(200).json({ message: 'Password updated successfully' });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error, please try again later' });
  }
});

// watchlist //
// add to watchlist
app.post('/watchlist/add_from_nft_browser', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware
  const { name, slug } = req.body; // Assuming collection is sent in the request body

  if (!userId) {
    return res.status(400).json({ error: "User ID is required. Please login first." });
  } else if (!slug) {
    return res.status(400).json({ error: "Must select a collection." });
  }

  try {
    // Check if the collection already exists in the user's watchlist
    db.get('SELECT * FROM watchlist WHERE user_id = ? AND collection_slug = ?', [userId, slug], (err, row) => {
      if (err) {
        throw err;
      }

      if (row) {
        // Collection already exists, return "Conflict" status code
        return res.status(409).json({ error: "Collection already in watchlist." });
      } else {
        // Collection does not exist, insert it
        db.run('INSERT INTO watchlist (user_id, collection_slug, collection_name, set_price) VALUES (?, ?, ?, ?)', [userId, slug, name, null], function (err) {
          if (err) {
            throw err;
          }

          // Fetch the inserted record
          db.get('SELECT * FROM watchlist WHERE user_id = ? AND collection_slug = ? AND collection_name = ?', [userId, slug, name], (err, insertedRow) => {
            if (err) {
              throw err;
            }
            return res.status(201).json(insertedRow);
          });
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// retrieve watchlist for account
app.get('/watchlist/retrieve_from_account', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware

  try {
    // Fetch all items belonging to the user
    db.all('SELECT * FROM watchlist WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/watchlist/delete', authenticateToken, (req, res) => {
  const { id } = req.body;
  const userId = req.user.userId;

  db.run('DELETE FROM watchlist WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({ success: true, id });
  });
});

app.put('/watchlist/edit', authenticateToken, (req, res) => {
  const { id, set_price } = req.body;
  const userId = req.user.userId;

  db.run('UPDATE watchlist SET set_price = ? WHERE id = ? AND user_id = ?', [set_price, id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get(
      'SELECT * FROM watchlist WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(row);
      }
    );
  });
});

// for testing only
app.post('/notifications/add', authenticateToken, (req, res) => {
  const { collection_slug, collection_name, floor_price, createdAt, updatedAt } = req.body;
  const userId = req.user.userId;

  if (!collection_name) {
    return res.status(400).json({ error: 'Notification message is required' });
  }

  db.run(
    'INSERT INTO notifications (user_id, collection_slug, collection_name, floor_price, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, collection_slug, collection_name, floor_price, createdAt, updatedAt],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Fetch the inserted notification
      db.get(
        'SELECT * FROM notifications WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          return res.status(201).json(row);
        }
      );
    }
  );
});

app.get('/notifications/retrieve_from_account', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware

  try {
    // Fetch all items belonging to the user
    db.all('SELECT * FROM notifications WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/notifications/delete', authenticateToken, (req, res) => {
  const { id } = req.body;
  const userId = req.user.userId;

  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({ success: true, id });
  });
});

app.delete('/notifications/delete-all', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.run('DELETE FROM notifications WHERE user_id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({ success: true });
  });
});

// galleries feature //
// retrieve galleries for account
app.get('/galleries/retrieve_from_account', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware

  try {
    // Fetch all items belonging to the user
    db.all('SELECT * FROM galleries WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/galleries/add', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware
  const { name, description } = req.body; // Assuming collection is sent in the request body

  try {
    // Check if the gallery already exists in the user's watchlist
    db.get('SELECT * FROM galleries WHERE name = ? AND user_id = ?', [name, userId], (err, row) => {
      if (err) {
        throw err;
      }

      if (row) {
        // Collection already exists, return "Conflict" status code
        return res.status(409).json({ error: "Gallery already exists!" });
      } else {
        // Collection does not exist, insert it
        db.run('INSERT INTO galleries (user_id, name, description) VALUES (?, ?, ?)', [userId, name, description], function (err) {
          if (err) {
            throw err;
          }

          // Fetch the inserted record
          db.get('SELECT * FROM galleries WHERE user_id = ? AND name = ?', [userId, name], (err, insertedRow) => {
            if (err) {
              throw err;
            }
            return res.status(201).json(insertedRow);
          });
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/galleries/edit', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const id = req.query.galleryId;
  const userId = req.user.userId;

  db.run('UPDATE galleries SET name = ?, description = ? WHERE id = ? AND user_id = ?', [name, description, id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get(
      'SELECT * FROM galleries WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(row);
      }
    );
  });
});

app.delete('/galleries/delete', authenticateToken, (req, res) => {
  const id = req.query.galleryId;
  const userId = req.user.userId;

  db.run('DELETE FROM galleries WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({ success: true, id });
  });
});

// gallery
app.get('/gallery-items/view', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware
  const galleryId = req.query.galleryId;

  try {
    // Fetch all items belonging to the user
    
    db.all('SELECT * FROM gallery_items WHERE gallery_id = ?', [galleryId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message});
      }
      return res.status(200).json(rows);
    });
  } catch (err) {
    return res.status(501).json({ error: err.message});
  }
});

app.post('/gallery-items/add', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming userId is set in the authenticateToken middleware
  const { gallery_id, contract_addr, token_id, collection_name } = req.body; // Assuming collection is sent in the request body

  try {
    // Check if the item already exists in the user's watchlist
    db.get('SELECT * FROM gallery_items WHERE gallery_id = ? AND contract_addr = ? AND token_id = ?', [gallery_id, contract_addr, token_id], (err, row) => {
      if (err) {
        throw err;
      }

      if (row) {
        // Collection already exists, return "Conflict" status code
        return res.status(409).json({ error: "Item already exists!" });
      } else {
        // Collection does not exist, insert it
        db.run('INSERT INTO gallery_items (gallery_id, contract_addr, token_id, collection_name) VALUES (?, ?, ?, ?)', [gallery_id, contract_addr, token_id, collection_name], function (err) {
          if (err) {
            throw err;
          }

          // Fetch the inserted record
          db.get('SELECT * FROM gallery_items WHERE gallery_id = ? AND contract_addr = ? AND token_id = ?', [gallery_id, contract_addr, token_id], (err, insertedRow) => {
            if (err) {
              throw err;
            }
            return res.status(201).json(insertedRow);
          });
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/gallery-items/delete', authenticateToken, (req, res) => {
  const id = req.query.itemId;
  const userId = req.user.userId;

  db.run('DELETE FROM gallery_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json({ success: true, id });
  });
});


// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);