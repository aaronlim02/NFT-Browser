// server/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, "6d4aecdc4712722d9ac57da9aaad537605979369d40a68a27539b21007aa3d42", (err, user) => {
    if (err) return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;