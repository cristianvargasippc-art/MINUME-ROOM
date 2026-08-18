const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${req.user.id}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes de perfil'));
    }
    return cb(null, true);
  }
});

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  commissionId: user.commission_id,
  profileImageUrl: user.profile_image_url || null
});

router.get('/login', (req, res) => {
  return res.status(405).json({
    error: 'Usa POST para iniciar sesión en /api/auth/login'
  });
});

router.post('/register', async (req, res) => {
  const { fullName, email, password, commissionId } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    let resolvedCommissionId = commissionId ? Number(commissionId) : null;

    if (!resolvedCommissionId) {
      const [commissions] = await db.query('SELECT id FROM commissions WHERE status = ? ORDER BY id ASC LIMIT 1', ['Activa']);
      resolvedCommissionId = commissions[0]?.id || null;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [insertResult] = await db.query(
      `INSERT INTO users (email, password, full_name, role, commission_id, is_active)
       VALUES (?, ?, ?, 'delegado', ?, TRUE)`,
      [email, passwordHash, fullName, resolvedCommissionId]
    );

    const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, 'REGISTER', 'USER', String(user.id), 'Registro publico de delegado', req.ip || 'unknown']
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        ...serializeUser(user)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!users.length) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Cuenta suspendida' });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(() => {});
    try {
      await db.query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, 'LOGIN', 'USER', String(user.id), 'Inicio de sesión exitoso', req.ip || 'unknown']
      );
    } catch (auditError) {
      console.warn('No se pudo registrar audit_log:', auditError.message);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      token,
      user: {
        ...serializeUser(user)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, full_name, role, commission_id, profile_image_url, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json(users[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/profile', authenticate, async (req, res) => {
  const { fullName } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'El nombre completo es obligatorio' });
  }

  try {
    await db.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName.trim(), req.user.id]);
    const [[user]] = await db.query(
      'SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/profile/image', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Selecciona una imagen de perfil' });
  }

  try {
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    await db.query('UPDATE users SET profile_image_url = ? WHERE id = ?', [profileImageUrl, req.user.id]);

    const [[user]] = await db.query(
      'SELECT id, email, full_name, role, commission_id, profile_image_url FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json(serializeUser(user));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
