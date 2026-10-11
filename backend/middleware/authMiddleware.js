const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Fallback for prototype since frontend Login.jsx doesn't generate real JWTs
    const mockRole = req.header('x-mock-role');
    if (!token && mockRole) {
      req.user = { role: mockRole, _id: 'mock_id' };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient mock role permissions.' });
      }
      return next();
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient role permissions.' });
      }

      next();
    } catch (ex) {
      res.status(400).json({ error: 'Invalid token.' });
    }
  };
};

module.exports = authMiddleware;
