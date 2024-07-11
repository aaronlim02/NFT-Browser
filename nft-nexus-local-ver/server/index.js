// server/index.js
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const authenticateToken = require('./middleware/auth');
const winston = require('winston'); 
const { User, Setting } = require('../database/models');
const sequelize = require('../database/sequelize');
const sqlite3 = require('sqlite3');
const dbPath = path.resolve(__dirname, '../database/database.sqlite'); // Adjust path as per your setup

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Configure Winston logger + test
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' }),
  ],
});
logger.info('hello world!');


const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const jwtSecretKey = process.env.JWT_SECRET;

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcryptjs.hash(password, 10);
  try {
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
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, jwtSecretKey, { expiresIn: '1h' });
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// retrieve account name
app.get('/api/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // id in users
    // Retrieve username from 'users' table
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) { throw err; }
      if (!row) { return res.status(404).json({ error: 'User not found' }); }

      const username = row.username;

      // Retrieve 'wallet-address' setting from 'settings' table
      db.get('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, 'wallet-address'], (err, row) => {
        if (err) { throw err; }

        if (!row) {
          res.json({ username: username, address: null });
        } else {
          res.json({ username: username, address: row.setting_value });
        }
      });
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/settings/personal-details', authenticateToken, async (req, res) => {
  const { yourWalletAddress } = req.body;
  const userId = req.user.userId;
  try {
    // Check if the preference already exists
    db.get('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, 'wallet-address'], async (err, row) => {
      if (err) { throw err; }

      if (row) {
        // Preference exists, update
        db.run('UPDATE settings SET setting_value = ? WHERE user_id = ? AND setting_key = ?', [yourWalletAddress, userId, 'wallet-address'], function(err) {
          if (err) { throw err; }

          // Fetch the updated record
          db.get('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, 'wallet-address'], (err, updatedRow) => {
            if (err) { throw err; }
            res.status(200).json(updatedRow);
          });
        });
      } else {
        // Preference does not exist, insert
        db.run('INSERT INTO settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)', [userId, 'wallet-address', yourWalletAddress], function(err) {
          if (err) { throw err; }

          // Fetch the inserted record
          db.get('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, 'wallet-address'], (err, insertedRow) => {
            if (err) { throw err; }
            res.status(201).json(insertedRow);
          });
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});