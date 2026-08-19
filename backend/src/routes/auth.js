import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { uploadErrorHandler } from "../middleware/uploadErrors.js";
import { removeUploadedFile } from "../utils/uploads.js";

const router = express.Router();
const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads", "profiles");
fs.mkdirSync(uploadDir, { recursive: true });

// La extensión guardada sale de este mapa y nunca del nombre que envía el
// cliente: /uploads se sirve desde el mismo origen que la app, así que dejar
// pasar un .html o un .js permitiría ejecutar scripts con la sesión de quien
// los abriera. SVG queda fuera a propósito, porque puede incrustar <script>.
const AVATAR_MIME_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
]);

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = AVATAR_MIME_EXTENSIONS.get(file.mimetype);
      cb(null, `${req.user.id}-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!AVATAR_MIME_EXTENSIONS.has(file.mimetype)) {
      const error = new Error("Formato no admitido. Usa JPG, PNG, WEBP, AVIF o GIF");
      error.status = 415;
      return cb(error);
    }
    return cb(null, true);
  },
});

const handleAvatarUploadError = uploadErrorHandler({
  LIMIT_FILE_SIZE: "La imagen supera el límite de 5 MB",
  LIMIT_FILE_COUNT: "Envía una sola imagen",
  LIMIT_UNEXPECTED_FILE: "Envía la imagen en el campo 'avatar'",
});

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  commissionId: user.commission_id,
  profileImageUrl: user.profile_image_url || null,
});

router.get("/login", (_req, res) => {
  return res.status(405).json({ error: "Usa POST para iniciar sesión en /api/auth/login" });
});

router.post("/register", async (req, res) => {
  const { fullName, password, commissionId } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const { rows: existingUsers } = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }

    let resolvedCommissionId = commissionId ? Number(commissionId) : null;

    if (!resolvedCommissionId) {
      const { rows: commissions } = await db.query("SELECT id FROM commissions WHERE status = $1 ORDER BY id ASC LIMIT 1", ["Activa"]);
      resolvedCommissionId = commissions[0]?.id || null;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insertResult = await db.query(
      `INSERT INTO users (email, password, full_name, role, commission_id, is_active)
       VALUES ($1, $2, $3, 'delegado', $4, TRUE)
       RETURNING id`,
      [email, passwordHash, fullName, resolvedCommissionId]
    );

    const userId = insertResult.rows[0].id;
    const { rows: [user] } = await db.query("SELECT * FROM users WHERE id = $1", [userId]);

    await db.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)",
      [user.id, "REGISTER", "USER", String(user.id), "Registro publico de delegado", req.ip || "unknown"]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    return res.status(201).json({
      token,
      user: { ...serializeUser(user) },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { password } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
  }

  try {
    const { rows: users } = await db.query("SELECT * FROM users WHERE LOWER(email) = $1", [email]);

    if (!users.length) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Cuenta suspendida" });
    }

    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    await db.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)",
      [user.id, "LOGIN", "USER", String(user.id), "Inicio de sesión exitoso", req.ip || "unknown"]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    return res.json({
      token,
      user: { ...serializeUser(user) },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/profile", authenticate, async (req, res) => {
  try {
    const { rows: users } = await db.query(
      "SELECT id, email, full_name, role, commission_id, profile_image_url, is_active, last_login, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(users[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/profile", authenticate, async (req, res) => {
  const { fullName } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: "El nombre completo es obligatorio" });
  }

  try {
    await db.query("UPDATE users SET full_name = $1 WHERE id = $2", [fullName.trim(), req.user.id]);
    const { rows: [user] } = await db.query(
      "SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/profile/image", authenticate, avatarUpload.single("avatar"), handleAvatarUploadError, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Selecciona una imagen de perfil" });
  }

  try {
    const { rows: [previous] } = await db.query("SELECT profile_image_url FROM users WHERE id = $1", [req.user.id]);
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    await db.query("UPDATE users SET profile_image_url = $1 WHERE id = $2", [profileImageUrl, req.user.id]);

    // El avatar anterior ya no es alcanzable: se borra para que la carpeta no
    // crezca sin límite.
    if (previous?.profile_image_url !== profileImageUrl) {
      removeUploadedFile(uploadDir, previous?.profile_image_url, "/uploads/profiles/");
    }

    const { rows: [user] } = await db.query(
      "SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;