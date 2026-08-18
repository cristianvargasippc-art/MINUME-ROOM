import express from "express";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { buildAlertRoles } from "../utils/scope.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const roles = buildAlertRoles(req.user.role);
    const { rows: alerts } = await db.query("SELECT * FROM alerts WHERE recipient_role = ANY($1) ORDER BY created_at DESC LIMIT 50", [roles]);
    return res.json(alerts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    await db.query("UPDATE alerts SET is_read = TRUE WHERE id = $1", [req.params.id]);
    const { rows } = await db.query("SELECT * FROM alerts WHERE id = $1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;