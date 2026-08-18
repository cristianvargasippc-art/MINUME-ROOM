import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

const buildCommissionScope = (user) => {
  if (user.role === "mesa" || user.role === "delegado") {
    return { clause: "WHERE c.id = $1", params: [user.commission_id] };
  }
  return { clause: "", params: [] };
};

router.get("/", authenticate, async (req, res) => {
  try {
    const scope = buildCommissionScope(req.user);
    const { rows: commissions } = await db.query(
      `SELECT
        c.*,
        COUNT(DISTINCT u.id) AS members_count,
        COUNT(DISTINCT a.id) AS assignments_count,
        SUM(CASE WHEN a.status IN ('Asignada', 'En Progreso', 'Entregada', 'En Validacion') THEN 1 ELSE 0 END) AS active_assignments
      FROM commissions c
      LEFT JOIN users u ON u.commission_id = c.id AND u.is_active = TRUE
      LEFT JOIN assignments a ON a.commission_id = c.id
      ${scope.clause}
      GROUP BY c.id
      ORDER BY c.name ASC`,
      scope.params
    );
    return res.json(commissions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, authorize("superadmin", "secretaria"), async (req, res) => {
  const { name, code, section, chairName, description, theme } = req.body;

  if (!name || !code || !section || !chairName || !description) {
    return res.status(400).json({ error: "Faltan campos obligatorios para crear la comisión" });
  }

  try {
    const { rows: [maxRow] } = await db.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM commissions");
    const nextId = maxRow.maxid + 1;

    await db.query(
      `INSERT INTO commissions (id, name, code, section, chair_name, description, theme, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activa', $8)`,
      [nextId, name, code, section, chairName, description, theme || "sunrise", req.user.id]
    );

    const { rows } = await db.query("SELECT * FROM commissions WHERE id = $1", [nextId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const commissionId = Number(req.params.id);
    const scope = buildCommissionScope(req.user);

    if (scope.params.length && scope.params[0] !== commissionId) {
      return res.status(403).json({ error: "No tienes acceso a esta comisión" });
    }

    const { rows: [commission] } = await db.query(
      `SELECT
        c.*,
        COUNT(DISTINCT u.id) AS members_count,
        COUNT(DISTINCT a.id) AS assignments_count
      FROM commissions c
      LEFT JOIN users u ON u.commission_id = c.id AND u.is_active = TRUE
      LEFT JOIN assignments a ON a.commission_id = c.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [commissionId]
    );

    if (!commission) {
      return res.status(404).json({ error: "Comisión no encontrada" });
    }

    const { rows: people } = await db.query(
      `SELECT id, full_name, email, role, is_active, last_login, created_at
       FROM users
       WHERE commission_id = $1
       ORDER BY CASE role WHEN 'mesa' THEN 1 WHEN 'delegado' THEN 2 ELSE 3 END, full_name ASC`,
      [commissionId]
    );

    const { rows: assignments } = await db.query(
      `SELECT a.*, u.full_name AS creator_name
       FROM assignments a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.commission_id = $1
       ORDER BY a.deadline ASC, a.created_at DESC`,
      [commissionId]
    );

    const { rows: recentActivity } = await db.query(
      `SELECT
        'assignment' AS item_type,
        a.id AS item_id,
        a.title,
        a.status,
        a.created_at
       FROM assignments a
       WHERE a.commission_id = $1
       ORDER BY a.created_at DESC
       LIMIT 5`,
      [commissionId]
    );

    return res.json({ commission, people, assignments, recentActivity });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/people", authenticate, authorize("superadmin", "secretaria", "mesa"), async (req, res) => {
  const commissionId = Number(req.params.id);
  const { fullName, email, role } = req.body;

  if (!fullName || !email || !role) {
    return res.status(400).json({ error: "Faltan campos obligatorios para agregar una integrante" });
  }

  if (!["mesa", "delegado"].includes(role)) {
    return res.status(400).json({ error: "Solo se pueden agregar roles mesa o delegado" });
  }

  if (req.user.role === "mesa" && req.user.commission_id !== commissionId) {
    return res.status(403).json({ error: "No puedes agregar integrantes fuera de tu comisión" });
  }

  try {
    const tempPasswordHash = await bcrypt.hash("Minume2025!", 12);

    await db.query(
      `INSERT INTO users (email, password, full_name, role, commission_id, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)`,
      [email, tempPasswordHash, fullName, role, commissionId]
    );

    const { rows } = await db.query(
      `SELECT id, full_name, email, role, commission_id, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;