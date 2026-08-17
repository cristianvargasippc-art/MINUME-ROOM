const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query(
      'SELECT id, email, full_name, role, commission_id, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Usuario no valido' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  return next();
};

module.exports = {
  authenticate,
  authorize
};
