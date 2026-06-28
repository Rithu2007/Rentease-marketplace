const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No session token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    }
    
    req.user = decodedUser;
    next();
  });
};

module.exports = { authenticateToken };
