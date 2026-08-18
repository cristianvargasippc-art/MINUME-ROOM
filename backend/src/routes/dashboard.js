import express from "express";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { buildAssignmentScope, buildAlertRoles } from "../utils/scope.js";

const router = express.Router();

const appendCondition = (baseClause, condition) => {
  if (!baseClause) return `WHERE ${condition}`;
  return `${baseClause} AND ${condition}`;
};

router.get("/metrics", authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    const statusOpenClause = appendCondition(scope.clause, "a.status IN ($1, $2, $3, $4)");
    const deliveredClause = appendCondition(scope.clause, "a.status IN ($1, $2, $3, $4)");
    const alertRoles = buildAlertRoles(req.user.role);

    const [[activeTasks]] = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${statusOpenClause}`,
      [...scope.params, "Asignada", "En Progreso", "Entregada", "En Validacion"]
    );
    const [[totalAssigned]] = await db.query(`SELECT COUNT(*) AS count FROM assignments a ${scope.clause}`, scope.params);
    const [[delivered]] = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${deliveredClause}`,
      [...scope.params, "Entregada", "Evaluada", "En Validacion", "Validada"]
    );
    const [[totalEvaluated]] = await db.query("SELECT COUNT(*) AS count FROM evaluations");
    const [[approved]] = await db.query("SELECT COUNT(*) AS count FROM evaluations WHERE verdict = $1", ["Aprobado"]);
    const [[unreadAlerts]] = await db.query("SELECT COUNT(*) AS count FROM alerts WHERE recipient_role IN ($1) AND is_read = FALSE", [alertRoles]);

    return res.json({
      activeTasks: activeTasks.count,
      totalAssigned: totalAssigned.count,
      delivered: delivered.count,
      deliveryRate: totalAssigned.count ? Number(((delivered.count / totalAssigned.count) * 100).toFixed(2)) : 0,
      totalEvaluated: totalEvaluated.count,
      approved: approved.count,
      approvalRate: totalEvaluated.count ? Number(((approved.count / totalEvaluated.count) * 100).toFixed(2)) : 0,
      unreadAlerts: unreadAlerts.count,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/pipeline", authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    const statuses = ["Borrador", "Asignada", "En Progreso", "Entregada", "En Validacion", "Evaluada", "Rechazada", "Vencida"];
    const pipeline = {};

    for (const status of statuses) {
      const clause = appendCondition(scope.clause, "a.status = $1");
      const [[row]] = await db.query(`SELECT COUNT(*) AS count FROM assignments a ${clause}`, [...scope.params, status]);
      pipeline[status] = row.count;
    }

    return res.json(pipeline);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;