const jwt = require('jsonwebtoken');

// Verifies "Authorization: Bearer <token>" and attaches { id, type } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, type: payload.type };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' });
  }
}

// Must run after authenticate. Only 'admin' users pass.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
