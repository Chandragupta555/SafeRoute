const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Read Authorization header: "Bearer <token>"
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If valid: attach decoded user payload to req.user
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication required' });
  }
};
