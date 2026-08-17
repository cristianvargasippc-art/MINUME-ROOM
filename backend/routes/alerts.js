const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { buildAlertRoles } = require('../utils/scope');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const roles = buildAlertRoles(req.user.role);
    const [alerts] = await db.query(
      'SELECT * FROM alerts WHERE recipient_role IN (?) ORDER BY created_at DESC LIMIT 50',
      [roles]
    );

    return res.json(alerts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_read = TRUE WHERE id = ?', [req.params.id]);
    const [rows] = await db.query('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
