import express from "express";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { buildAssignmentScope, buildAlertRoles } from "../utils/scope.js";

const router = express.Router();

const appendCondition = (baseClause, condition) => {
  if (!baseClause) return `WHERE ${condition}`;
  return `${baseClause} AND ${condition}`;
};

// COUNT(*) llega como string desde PostgreSQL (bigint), hay que convertirlo
// antes de compararlo o dividirlo: "0" es truthy y rompe los porcentajes.
const toCount = (row) => Number(row.count);

router.get("/metrics", authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    // Los placeholders del scope van primero, los estados se numeran despues.
    const offset = scope.params.length;
    const statusPlaceholders = [1, 2, 3, 4].map((i) => `$${offset + i}`).join(", ");
    const statusOpenClause = appendCondition(scope.clause, `a.status IN (${statusPlaceholders})`);
    const deliveredClause = appendCondition(scope.clause, `a.status IN (${statusPlaceholders})`);
    const alertRoles = buildAlertRoles(req.user.role);

    const { rows: [activeTasks] } = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${statusOpenClause}`,
      [...scope.params, "Asignada", "En Progreso", "Entregada", "En Validacion"]
    );
    const { rows: [totalAssigned] } = await db.query(`SELECT COUNT(*) AS count FROM assignments a ${scope.clause}`, scope.params);
    const { rows: [delivered] } = await db.query(
      `SELECT COUNT(*) AS count FROM assignments a ${deliveredClause}`,
      [...scope.params, "Entregada", "Evaluada", "En Validacion", "Validada"]
    );
    const { rows: [totalEvaluated] } = await db.query("SELECT COUNT(*) AS count FROM evaluations");
    const { rows: [approved] } = await db.query("SELECT COUNT(*) AS count FROM evaluations WHERE verdict = $1", ["Aprobado"]);
    const { rows: [unreadAlerts] } = await db.query("SELECT COUNT(*) AS count FROM alerts WHERE recipient_role = ANY($1) AND is_read = FALSE", [alertRoles]);

    const totalAssignedCount = toCount(totalAssigned);
    const deliveredCount = toCount(delivered);
    const totalEvaluatedCount = toCount(totalEvaluated);
    const approvedCount = toCount(approved);

    return res.json({
      activeTasks: toCount(activeTasks),
      totalAssigned: totalAssignedCount,
      delivered: deliveredCount,
      deliveryRate: totalAssignedCount ? Number(((deliveredCount / totalAssignedCount) * 100).toFixed(2)) : 0,
      totalEvaluated: totalEvaluatedCount,
      approved: approvedCount,
      approvalRate: totalEvaluatedCount ? Number(((approvedCount / totalEvaluatedCount) * 100).toFixed(2)) : 0,
      unreadAlerts: toCount(unreadAlerts),
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
      const clause = appendCondition(scope.clause, `a.status = $${scope.params.length + 1}`);
      const { rows: [row] } = await db.query(`SELECT COUNT(*) AS count FROM assignments a ${clause}`, [...scope.params, status]);
      pipeline[status] = toCount(row);
    }

    return res.json(pipeline);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
