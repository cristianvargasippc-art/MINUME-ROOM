import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import { db } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { buildAssignmentScope } from "../utils/scope.js";
import { removeUploadedFile } from "../utils/uploads.js";

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
});

const router = express.Router();

const generateId = () => {
  const date = new Date();
  const prefix = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return `ASG-${prefix}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
};

router.post("/", authenticate, authorize("secretaria", "superadmin", "mesa"), async (req, res) => {
  const { title, type, description, objective, expectedProduct, deadline, evaluationCriteria, commissionIds, commissionId } = req.body;

  const resolvedCommissionIds = Array.isArray(commissionIds) && commissionIds.length
    ? commissionIds
    : commissionId ? [commissionId] : [];

  if (!title || !type || !description || !objective || !deadline || !evaluationCriteria || !resolvedCommissionIds.length) {
    return res.status(400).json({ error: "Faltan campos obligatorios para crear la asignación" });
  }

  try {
    const createdAssignments = [];

    for (const commissionIdValue of resolvedCommissionIds) {
      const numericCommissionId = Number(commissionIdValue);

      if (req.user.role === "mesa" && req.user.commission_id !== numericCommissionId) {
        return res.status(403).json({ error: "No puedes crear tareas fuera de tu comisión" });
      }

      const assignmentId = generateId();
      await db.query(
        `INSERT INTO assignments (
          assignment_id, title, type, description, objective, expected_product,
          deadline, evaluation_criteria, status, created_by, commission_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [assignmentId, title, type, description, objective, expectedProduct || "PDF", deadline, evaluationCriteria, "Asignada", req.user.id, numericCommissionId]
      );

      const { rows } = await db.query("SELECT * FROM assignments WHERE assignment_id = $1", [assignmentId]);
      createdAssignments.push(rows[0]);

      await db.query(
        "INSERT INTO alerts (code, type, message, severity, recipient_role, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        ["ALT-001", "NUEVA_ASIGNACION", `Nueva asignación: ${title}`, "info", "mesa", "ASSIGNMENT", assignmentId]
      );
    }

    return res.status(201).json(createdAssignments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const scope = buildAssignmentScope(req.user);
    const { rows: assignments } = await db.query(
      `SELECT a.*, u.full_name AS creator_name, c.name AS commission_name, c.code AS commission_code
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN commissions c ON a.commission_id = c.id
       ${scope.clause}
       ORDER BY a.created_at DESC`,
      scope.params
    );
    return res.json(assignments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, u.full_name AS creator_name, c.name AS commission_name, c.code AS commission_code
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN commissions c ON a.commission_id = c.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/confirm", authenticate, authorize("mesa"), async (req, res) => {
  try {
    await db.query("UPDATE assignments SET status = $1 WHERE id = $2 AND status = $3", ["En Progreso", req.params.id, "Asignada"]);
    const { rows } = await db.query("SELECT * FROM assignments WHERE id = $1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id/submissions", authenticate, async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    const { rows: assignmentRows } = await db.query("SELECT * FROM assignments WHERE id = $1", [assignmentId]);

    if (!assignmentRows.length) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }

    const assignment = assignmentRows[0];

    if (["delegado", "mesa"].includes(req.user.role) && req.user.commission_id !== assignment.commission_id) {
      return res.status(403).json({ error: "No tienes permiso para ver los envíos de esta asignación" });
    }

    const ownSubmissionOnly = req.user.role === "delegado";
    const { rows: submissions } = await db.query(
      `SELECT
        s.*,
        u.full_name AS submitted_by_name,
        e.id AS evaluation_id,
        e.total_score,
        e.verdict,
        e.strengths,
        e.improvements,
        e.recommendations,
        e.created_at AS evaluated_at,
        evaluator.full_name AS evaluated_by_name
       FROM submissions s
       LEFT JOIN users u ON s.submitted_by = u.id
       LEFT JOIN evaluations e ON e.id = (
         SELECT MAX(ev.id)
         FROM evaluations ev
         WHERE ev.submission_id = s.id
       )
       LEFT JOIN users evaluator ON evaluator.id = e.evaluated_by
       WHERE s.assignment_id = $1
       AND s.id IN (
         SELECT MAX(latest.id)
         FROM submissions latest
         WHERE latest.assignment_id = $1
         GROUP BY latest.submitted_by
       )
       ${ownSubmissionOnly ? "AND s.submitted_by = $2" : ""}
       ORDER BY s.submitted_at DESC`,
      ownSubmissionOnly ? [assignmentId, req.user.id] : [assignmentId]
    );

    return res.json(submissions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/submissions", authenticate, upload.single("document"), async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    const { rows: assignmentRows } = await db.query("SELECT * FROM assignments WHERE id = $1", [assignmentId]);

    if (!assignmentRows.length) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }

    const assignment = assignmentRows[0];

    if (["delegado", "mesa"].includes(req.user.role) && req.user.commission_id !== assignment.commission_id) {
      return res.status(403).json({ error: "No puedes enviar un documento para esta asignación" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para enviar" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const { rows: existingSubmissions } = await db.query(
      "SELECT id, file_url FROM submissions WHERE assignment_id = $1 AND submitted_by = $2 ORDER BY submitted_at DESC LIMIT 1",
      [assignmentId, req.user.id]
    );

    let submissionId;

    if (existingSubmissions.length) {
      submissionId = existingSubmissions[0].id;
      const replacedFileUrl = existingSubmissions[0].file_url;

      await db.query(
        `UPDATE submissions SET file_url = $1, file_name = $2, file_size = $3, status = 'Entregada', submitted_at = NOW(), version = version + 1 WHERE id = $4`,
        [fileUrl, req.file.originalname, req.file.size, submissionId]
      );

      // La fila se actualiza en sitio, así que el fichero sustituido ya no se
      // puede abrir desde la app: se borra para no dejarlo ocupando disco.
      if (replacedFileUrl !== fileUrl) {
        removeUploadedFile(uploadDir, replacedFileUrl, "/uploads/");
      }
    } else {
      const insertResult = await db.query(
        `INSERT INTO submissions (assignment_id, submitted_by, file_url, file_name, file_size, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
        [assignmentId, req.user.id, fileUrl, req.file.originalname, req.file.size, "Entregada"]
      );
      submissionId = insertResult.rows[0].id;
    }

    await db.query(
      `UPDATE assignments SET status = CASE WHEN status IN ('Borrador', 'Asignada', 'En Progreso') THEN 'Entregada' ELSE status END WHERE id = $1`,
      [assignmentId]
    );

    await db.query(
      "INSERT INTO alerts (code, type, message, severity, recipient_role, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      ["ALT-002", "TAREA_ENTREGADA", `Entrega recibida: ${assignment.title}`, "info", "mesa", "ASSIGNMENT", assignment.assignment_id]
    );

    const { rows } = await db.query("SELECT * FROM submissions WHERE id = $1", [submissionId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/submissions/:submissionId/evaluation", authenticate, authorize("mesa", "secretaria", "superadmin"), async (req, res) => {
  const assignmentId = Number(req.params.id);
  const submissionId = Number(req.params.submissionId);
  const { score, verdict, feedback } = req.body;

  const numericScore = Number(score);
  const resolvedVerdict = verdict === "return" ? "En Correccion" : "Aprobado";

  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
    return res.status(400).json({ error: "La calificación debe estar entre 0 y 100" });
  }

  try {
    const { rows: [submission] } = await db.query(
      `SELECT s.*, a.commission_id, a.assignment_id, a.title
       FROM submissions s
       INNER JOIN assignments a ON a.id = s.assignment_id
       WHERE s.id = $1 AND s.assignment_id = $2`,
      [submissionId, assignmentId]
    );

    if (!submission) {
      return res.status(404).json({ error: "Entrega no encontrada" });
    }

    if (req.user.role === "mesa" && req.user.commission_id !== submission.commission_id) {
      return res.status(403).json({ error: "No puedes evaluar entregas fuera de tu comisión" });
    }

    const bandScore = numericScore >= 90 ? 4 : numericScore >= 75 ? 3 : numericScore >= 60 ? 2 : 1;
    const message = feedback || (resolvedVerdict === "Aprobado" ? "Entrega aprobada por la mesa directiva." : "La entrega fue devuelta para corrección.");

    const insertResult = await db.query(
      `INSERT INTO evaluations (
        submission_id, evaluated_by,
        alignment_score, argument_score, structure_score, originality_score, writing_score,
        total_score, verdict, strengths, improvements, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        submissionId, req.user.id,
        bandScore, bandScore, bandScore, bandScore, bandScore,
        numericScore, resolvedVerdict,
        resolvedVerdict === "Aprobado" ? message : "Pendiente de corrección.",
        resolvedVerdict === "En Correccion" ? message : "Mantener el nivel de calidad alcanzado.",
        message
      ]
    );

    await db.query("UPDATE submissions SET status = $1 WHERE id = $2", [resolvedVerdict === "Aprobado" ? "Evaluada" : "Rechazada", submissionId]);
    await db.query(
      `UPDATE assignments SET status = CASE WHEN $1 = 'Aprobado' THEN 'Evaluada' ELSE 'Rechazada' END WHERE id = $2`,
      [resolvedVerdict, assignmentId]
    );

    await db.query(
      "INSERT INTO alerts (code, type, message, severity, recipient_role, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        "ALT-003",
        resolvedVerdict === "Aprobado" ? "TAREA_CALIFICADA" : "TAREA_DEVUELTA",
        `${resolvedVerdict === "Aprobado" ? "Tarea calificada" : "Tarea devuelta"}: ${submission.title}`,
        resolvedVerdict === "Aprobado" ? "info" : "warning",
        "delegado",
        "ASSIGNMENT",
        submission.assignment_id,
      ]
    );

    const { rows: [evaluation] } = await db.query(
      `SELECT e.*, u.full_name AS evaluated_by_name
       FROM evaluations e
       LEFT JOIN users u ON u.id = e.evaluated_by
       WHERE e.id = $1`,
      [insertResult.rows[0].id]
    );

    return res.status(201).json(evaluation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;