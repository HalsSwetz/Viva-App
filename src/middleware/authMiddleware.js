const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) return res.status(401).json({ message: 'Token missing' });
  
    const token = authHeader.split(' ')[1];
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded Token:', decoded);
      req.user = decoded; // access to userId in req.user.userId
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
  
  module.exports = verifyToken;