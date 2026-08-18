const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { buildAssignmentScope, buildAlertRoles } = require('../utils/scope');

const router = express.Router();

const appendCondition = (baseClause, condition) => {
  if (!baseClause) {
    return `WHERE ${condition}`;
  }

  return `${baseClause} AND ${condition}`;
};

router.get('/metrics', authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    const statusOpenClause = appendCondition(scope.clause, 'a.status IN ($1, $2, $3, $4)');
    const deliveredClause = appendCondition(scope.clause, 'a.status IN ($1, $2, $3, $4)');
    const alertRoles = buildAlertRoles(req.user.role);

    const activeTasks = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${statusOpenClause}`,
      [...scope.params, 'Asignada', 'En Progreso', 'Entregada', 'En Validacion']
    );
    const totalAssigned = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${scope.clause}`,
      scope.params
    );
    const delivered = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${deliveredClause}`,
      [...scope.params, 'Entregada', 'Evaluada', 'En Validacion', 'Validada']
    );
    const totalEvaluated = await db.query('SELECT COUNT(*) AS count FROM evaluations');
    const approved = await db.query(
      'SELECT COUNT(*) AS count FROM evaluations WHERE verdict = $1',
      ['Aprobado']
    );
    const unreadAlerts = await db.query(
      'SELECT COUNT(*) AS count FROM alerts WHERE recipient_role = ANY($1) AND is_read = FALSE',
      [alertRoles]
    );

    return res.json({
      activeTasks: Number(activeTasks.rows[0].count),
      totalAssigned: Number(totalAssigned.rows[0].count),
      delivered: Number(delivered.rows[0].count),
      deliveryRate: totalAssigned.rows[0].count ? Number(((Number(delivered.rows[0].count) / Number(totalAssigned.rows[0].count)) * 100).toFixed(2)) : 0,
      totalEvaluated: Number(totalEvaluated.rows[0].count),
      approved: Number(approved.rows[0].count),
      approvalRate: totalEvaluated.rows[0].count ? Number(((Number(approved.rows[0].count) / Number(totalEvaluated.rows[0].count)) * 100).toFixed(2)) : 0,
      unreadAlerts: Number(unreadAlerts.rows[0].count)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/pipeline', authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    const statuses = [
      'Borrador',
      'Asignada',
      'En Progreso',
      'Entregada',
      'En Validacion',
      'Evaluada',
      'Rechazada',
      'Vencida'
    ];

    const pipeline = {};

    for (const status of statuses) {
      const clause = appendCondition(scope.clause, 'a.status = $1');
      const rowResult = await db.query(
        `SELECT COUNT(*) AS count FROM assignments a ${clause}`,
        [...scope.params, status]
      );
      pipeline[status] = Number(rowResult.rows[0].count);
    }

    return res.json(pipeline);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;