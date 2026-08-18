import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads", "profiles");
fs.mkdirSync(uploadDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${req.user.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes de perfil"));
    }
    return cb(null, true);
  },
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
  const { fullName, email, password, commissionId } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }

    let resolvedCommissionId = commissionId ? Number(commissionId) : null;

    if (!resolvedCommissionId) {
      const [commissions] = await db.query("SELECT id FROM commissions WHERE status = $1 ORDER BY id ASC LIMIT 1", ["Activa"]);
      resolvedCommissionId = commissions[0]?.id || null;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [insertResult] = await db.query(
      `INSERT INTO users (email, password, full_name, role, commission_id, is_active)
       VALUES ($1, $2, $3, 'delegado', $4, TRUE)
       RETURNING id`,
      [email, passwordHash, fullName, resolvedCommissionId]
    );

    const userId = insertResult.rows[0].id;
    const [[user]] = await db.query("SELECT * FROM users WHERE id = $1", [userId]);

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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = $1", [email]);

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
    const [users] = await db.query(
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
    const [[user]] = await db.query(
      "SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/profile/image", authenticate, avatarUpload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Selecciona una imagen de perfil" });
  }

  try {
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    await db.query("UPDATE users SET profile_image_url = $1 WHERE id = $2", [profileImageUrl, req.user.id]);

    const [[user]] = await db.query(
      "SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;