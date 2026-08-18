const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { buildAlertRoles } = require('../utils/scope');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const roles = buildAlertRoles(req.user.role);
    const alertsResult = await db.query(
      'SELECT * FROM alerts WHERE recipient_role = ANY($1) ORDER BY created_at DESC LIMIT 50',
      [roles]
    );

    return res.json(alertsResult.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_read = TRUE WHERE id = $1', [req.params.id]);
    const rowsResult = await db.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    return res.json(rowsResult.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;