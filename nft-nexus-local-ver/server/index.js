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
const dbPath = path.resolve(__dirname, '../database/database.sqlite');

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

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Export the app instance for testing
module.exports = app;