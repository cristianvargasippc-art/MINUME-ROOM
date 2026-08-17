# MINUME XVII — GUÍA VS CODE
## Arquitectura: React.js (Frontend) + Node.js + Express.js (Backend) + MySQL (Database)

---

## 1. CREAR CARPETAS EN VS CODE

Abre VS Code, crea una carpeta vacia llamada `MINUME_XVII` y dentro crea esta estructura:

```
MINUME_XVII/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       ├── index.css
│       ├── index.js
│       └── .env
│   └── package.json
└── database/
    └── minume_xvii.sql
```

---

## 2. BACKEND — package.json

Crea `backend/package.json` y pega esto:

```json
{
  "name": "minume-xvii-backend",
  "version": "1.0.0",
  "description": "Backend MINUME XVII",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.6.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.2",
    "express-rate-limit": "^6.10.0",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 3. BACKEND — .env

Crea `backend/.env` y pega esto (cambia la contrasena):

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contrasena_mysql
DB_NAME=minume_xvii
JWT_SECRET=minume_xvii_secret_key_2025_super_segura
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

---

## 4. BACKEND — config/db.js

Crea `backend/config/db.js` y pega esto:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'minume_xvii',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
```

---

## 5. BACKEND — database/minume_xvii.sql

Crea `database/minume_xvii.sql` y pega esto:

```sql
CREATE DATABASE IF NOT EXISTS minume_xvii CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE minume_xvii;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'secretaria', 'mesa', 'delegado') NOT NULL,
  commission_id INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de asignaciones
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  type ENUM('TAS-01', 'TAS-02', 'TAS-03', 'TAS-04', 'TAS-05') NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  expected_product ENUM('PDF', 'Presentacion', 'Planilla') DEFAULT 'PDF',
  deadline DATETIME NOT NULL,
  evaluation_criteria TEXT NOT NULL,
  status ENUM('Borrador', 'Asignada', 'En Progreso', 'Entregada', 'En Validacion', 'Evaluada', 'Rechazada', 'Vencida') DEFAULT 'Borrador',
  created_by INT NOT NULL,
  commission_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  assigned_to INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de entregas
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  submitted_by INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  status ENUM('Borrador', 'Entregada', 'En Evaluacion', 'Evaluada', 'En Validacion', 'Validada', 'Rechazada', 'Vencida') DEFAULT 'Borrador',
  submitted_at DATETIME DEFAULT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  evaluated_by INT NOT NULL,
  alignment_score INT NOT NULL CHECK (alignment_score BETWEEN 1 AND 4),
  argument_score INT NOT NULL CHECK (argument_score BETWEEN 1 AND 4),
  structure_score INT NOT NULL CHECK (structure_score BETWEEN 1 AND 4),
  originality_score INT NOT NULL CHECK (originality_score BETWEEN 1 AND 4),
  writing_score INT NOT NULL CHECK (writing_score BETWEEN 1 AND 4),
  total_score DECIMAL(3,2) NOT NULL,
  verdict ENUM('Aprobado', 'En Correccion', 'Rechazado') NOT NULL,
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  correction_deadline DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
  recipient_role ENUM('superadmin', 'secretaria', 'mesa', 'delegado', 'all') NOT NULL,
  related_entity_type VARCHAR(50) NOT NULL,
  related_entity_id VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO users (email, password, full_name, role, is_active) VALUES
('superadmin@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Superadmin MINUME XVII', 'superadmin', TRUE),
('secretaria@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Secretaria de Control y Calidad', 'secretaria', TRUE),
('mesa.educacion@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Mesa Directiva - Educacion', 'mesa', TRUE),
('mesa.cooperacion@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Mesa Directiva - Cooperacion', 'mesa', TRUE),
('delegado1@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Ana Maria Lopez', 'delegado', TRUE),
('delegado2@minume-xvii.edu.do', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'Carlos Perez', 'delegado', TRUE);

-- Actualizar commission_id para mesas y delegados
UPDATE users SET commission_id = 1 WHERE email = 'mesa.educacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 2 WHERE email = 'mesa.cooperacion@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado1@minume-xvii.edu.do';
UPDATE users SET commission_id = 1 WHERE email = 'delegado2@minume-xvii.edu.do';
```

---

## 6. BACKEND — middleware/auth.js

Crea `backend/middleware/auth.js` y pega esto:

```javascript
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [decoded.id]);

    if (users.length === 0) return res.status(401).json({ error: 'Usuario no valido' });
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

---

## 7. BACKEND — routes/auth.js

Crea `backend/routes/auth.js` y pega esto:

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) return res.status(401).json({ error: 'Credenciales invalidas' });
    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Credenciales invalidas' });
    if (!user.is_active) return res.status(403).json({ error: 'Cuenta suspendida' });

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, 'LOGIN', 'USER', user.id, 'Inicio de sesion exitoso', req.ip || 'unknown']
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        commissionId: user.commission_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, full_name, role, commission_id, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 8. BACKEND — routes/assignments.js

Crea `backend/routes/assignments.js` y pega esto:

```javascript
const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const generateId = () => {
  const d = new Date();
  return 'ASG-' + d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*999)).padStart(3,'0');
};

router.post('/', authenticate, authorize('secretaria', 'superadmin'), async (req, res) => {
  try {
    const { title, type, description, objective, expectedProduct, deadline, evaluationCriteria, commissionIds } = req.body;
    const assignments = [];

    for (const commissionId of commissionIds) {
      const aid = generateId();
      await db.query(
        'INSERT INTO assignments (assignment_id, title, type, description, objective, expected_product, deadline, evaluation_criteria, status, created_by, commission_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [aid, title, type, description, objective, expectedProduct || 'PDF', deadline, evaluationCriteria, 'Asignada', req.user.id, commissionId]
      );
      const [rows] = await db.query('SELECT * FROM assignments WHERE assignment_id = ?', [aid]);
      assignments.push(rows[0]);

      await db.query(
        'INSERT INTO alerts (code, type, message, severity, recipient_role, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['ALT-001', 'NUEVA_ASIGNACION', 'Nueva asignacion: ' + title, 'info', 'mesa', 'ASSIGNMENT', aid]
      );
    }
    res.status(201).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { role, id, commission_id } = req.user;
    let query = 'SELECT a.*, u.full_name as creator_name FROM assignments a LEFT JOIN users u ON a.created_by = u.id';
    let params = [];

    if (role === 'delegado') {
      query += ' WHERE a.assigned_to = ?';
      params = [id];
    } else if (role === 'mesa') {
      query += ' WHERE a.commission_id = ?';
      params = [commission_id];
    }
    query += ' ORDER BY a.created_at DESC';

    const [assignments] = await db.query(query, params);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asignacion no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/confirm', authenticate, authorize('mesa'), async (req, res) => {
  try {
    await db.query('UPDATE assignments SET status = ? WHERE id = ? AND status = ?', ['En Progreso', req.params.id, 'Asignada']);
    const [rows] = await db.query('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 9. BACKEND — routes/dashboard.js

Crea `backend/routes/dashboard.js` y pega esto:

```javascript
const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/metrics', authenticate, async (req, res) => {
  try {
    const { role, id, commission_id } = req.user;
    let where = '';
    let params = [];

    if (role === 'delegado') { where = 'WHERE assigned_to = ?'; params = [id]; }
    else if (role === 'mesa') { where = 'WHERE commission_id = ?'; params = [commission_id]; }

    const [[activeTasks]] = await db.query('SELECT COUNT(*) as count FROM assignments ' + where + ' AND status IN (?, ?, ?, ?)', [...params, 'Asignada', 'En Progreso', 'Entregada', 'En Validacion']);
    const [[totalAssigned]] = await db.query('SELECT COUNT(*) as count FROM assignments ' + where, params);
    const [[delivered]] = await db.query('SELECT COUNT(*) as count FROM assignments ' + where + ' AND status IN (?, ?, ?, ?)', [...params, 'Entregada', 'Evaluada', 'En Validacion', 'Validada']);
    const [[totalEvaluated]] = await db.query('SELECT COUNT(*) as count FROM evaluations');
    const [[approved]] = await db.query('SELECT COUNT(*) as count FROM evaluations WHERE verdict = ?', ['Aprobado']);
    const [[unreadAlerts]] = await db.query('SELECT COUNT(*) as count FROM alerts WHERE recipient_role IN (?, ?) AND is_read = FALSE', [role, 'all']);

    res.json({
      activeTasks: activeTasks.count,
      totalAssigned: totalAssigned.count,
      delivered: delivered.count,
      deliveryRate: totalAssigned.count > 0 ? Math.round((delivered.count / totalAssigned.count) * 100 * 100) / 100 : 0,
      totalEvaluated: totalEvaluated.count,
      approved: approved.count,
      approvalRate: totalEvaluated.count > 0 ? Math.round((approved.count / totalEvaluated.count) * 100 * 100) / 100 : 0,
      unreadAlerts: unreadAlerts.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pipeline', authenticate, async (req, res) => {
  try {
    const { role, commission_id } = req.user;
    let where = '';
    let params = [];

    if (role === 'mesa') { where = 'WHERE commission_id = ?'; params = [commission_id]; }
    else if (role === 'delegado') { where = 'WHERE assigned_to = ?'; params = [req.user.id]; }

    const statuses = ['Borrador', 'Asignada', 'En Progreso', 'Entregada', 'En Validacion', 'Evaluada', 'Rechazada', 'Vencida'];
    const pipeline = {};

    for (const status of statuses) {
      const [[row]] = await db.query('SELECT COUNT(*) as count FROM assignments ' + where + (where ? ' AND' : 'WHERE') + ' status = ?', where ? [...params, status] : [status]);
      pipeline[status] = row.count;
    }
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 10. BACKEND — routes/alerts.js

Crea `backend/routes/alerts.js` y pega esto:

```javascript
const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    const roles = role === 'superadmin' ? ['all', 'superadmin'] : [role, 'all'];
    const [alerts] = await db.query(
      'SELECT * FROM alerts WHERE recipient_role IN (?) ORDER BY created_at DESC LIMIT 50',
      [roles]
    );
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_read = TRUE WHERE id = ?', [req.params.id]);
    const [rows] = await db.query('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 11. BACKEND — server.js (ARCHIVO PRINCIPAL)

Crea `backend/server.js` y pega esto:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('join_room', (room) => socket.join(room));
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});
app.set('io', io);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('=== MINUME XVII BACKEND ===');
  console.log('Servidor corriendo en puerto ' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');
  console.log('Health: http://localhost:' + PORT + '/health');
});
```

---

## 12. FRONTEND — package.json

Crea `frontend/package.json` y pega esto:

```json
{
  "name": "minume-xvii-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.7.2",
    "react-toastify": "^9.1.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  },
  "devDependencies": {
    "react-scripts": "5.0.1"
  },
  "proxy": "http://localhost:3001"
}
```

---

## 13. FRONTEND — .env

Crea `frontend/.env` y pega esto:

```env
REACT_APP_API_URL=http://localhost:3001
```

---

## 14. FRONTEND — public/index.html

Crea `frontend/public/index.html` y pega esto:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#1a237e" />
  <meta name="description" content="MINUME XVII - Sistema Academico Digital" />
  <title>MINUME XVII</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f3f4f6; }
  </style>
</head>
<body>
  <noscript>Necesitas JavaScript para usar esta aplicacion.</noscript>
  <div id="root"></div>
</body>
</html>
```

---

## 15. FRONTEND — src/index.js

Crea `frontend/src/index.js` y pega esto:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 16. FRONTEND — src/App.jsx

Crea `frontend/src/App.jsx` y pega esto:

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';
import Alerts from './pages/Alerts';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
            <Route path="alerts" element={<Alerts />} />
          </Route>
        </Routes>
        <ToastContainer position="bottom-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## 17. FRONTEND — src/context/AuthContext.jsx

Crea `frontend/src/context/AuthContext.jsx` y pega esto:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 18. FRONTEND — src/components/ProtectedRoute.jsx

Crea `frontend/src/components/ProtectedRoute.jsx` y pega esto:

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><div style={{width:48,height:48,border:'4px solid #e5e7eb',borderTop:'4px solid #1a237e',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
```

---

## 19. FRONTEND — src/components/Layout.jsx

Crea `frontend/src/components/Layout.jsx` y pega esto:

```javascript
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
    { path: '/assignments', label: 'Asignaciones', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
    { path: '/alerts', label: 'Alertas', roles: ['superadmin', 'secretaria', 'mesa', 'delegado'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''));

  const styles = {
    container: { display: 'flex', height: '100vh', background: '#f3f4f6' },
    sidebar: { width: 256, background: '#1a237e', color: 'white', display: 'flex', flexDirection: 'column' },
    header: { padding: 24, borderBottom: '1px solid #283593' },
    title: { fontSize: 20, fontWeight: 'bold' },
    subtitle: { fontSize: 12, color: '#9fa8da', marginTop: 4 },
    nav: { flex: 1, padding: 16 },
    navLink: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 8, textDecoration: 'none', color: '#c5cae9', marginBottom: 4, transition: 'all 0.2s' },
    navLinkActive: { background: '#00bcd4', color: 'white' },
    footer: { padding: 16, borderTop: '1px solid #283593' },
    userName: { fontSize: 14, fontWeight: 500 },
    userRole: { fontSize: 12, color: '#9fa8da', textTransform: 'capitalize' },
    logoutBtn: { display: 'flex', alignItems: 'center', width: '100%', padding: '8px 16px', marginTop: 12, background: 'transparent', border: 'none', color: '#c5cae9', cursor: 'pointer', borderRadius: 8 },
    main: { flex: 1, overflow: 'auto', padding: 32 }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.header}>
          <h1 style={styles.title}>MINUME XVII</h1>
          <p style={styles.subtitle}>Sistema Academico Digital</p>
        </div>
        <nav style={styles.nav}>
          {filteredNav.map(item => (
            <NavLink key={item.path} to={item.path} style={({isActive}) => ({...styles.navLink, ...(isActive ? styles.navLinkActive : {})})}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.footer}>
          <p style={styles.userName}>{user?.fullName}</p>
          <p style={styles.userRole}>{user?.role}</p>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesion</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
```

---

## 20. FRONTEND — src/pages/Login.jsx

Crea `frontend/src/pages/Login.jsx` y pega esto:

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(API + '/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Bienvenido!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesion');
    } finally { setLoading(false); }
  };

  const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' },
    card: { background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a237e', textAlign: 'center' },
    subtitle: { color: '#6b7280', textAlign: 'center', marginTop: 8 },
    form: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    label: { fontSize: 14, fontWeight: 500, color: '#374151' },
    input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, outline: 'none' },
    button: { padding: '14px', background: '#1a237e', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>MINUME XVII</h1>
        <p style={styles.subtitle}>Sistema Academico Digital</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Correo Electronico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="superadmin@minume-xvii.edu.do" required />
          </div>
          <div>
            <label style={styles.label}>Contrasena</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="Minume2025!" required />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

---

## 21. FRONTEND — src/pages/Dashboard.jsx

Crea `frontend/src/pages/Dashboard.jsx` y pega esto:

```javascript
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;

    axios.get(API + '/api/dashboard/metrics').then(r => setMetrics(r.data));
    axios.get(API + '/api/dashboard/pipeline').then(r => { setPipeline(r.data); setLoading(false); });

    const interval = setInterval(() => {
      axios.get(API + '/api/dashboard/metrics').then(r => setMetrics(r.data));
      axios.get(API + '/api/dashboard/pipeline').then(r => setPipeline(r.data));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    'Borrador': '#9e9e9e', 'Asignada': '#2196f3', 'En Progreso': '#ffc107',
    'Entregada': '#ff9800', 'En Validacion': '#9c27b0', 'Evaluada': '#4caf50',
    'Rechazada': '#f44336', 'Vencida': '#b71c1c'
  };

  const cards = [
    { label: 'Tareas Activas', value: metrics?.activeTasks || 0, color: '#2196f3' },
    { label: 'Tasa de Entrega', value: (metrics?.deliveryRate || 0) + '%', color: '#4caf50' },
    { label: 'Tasa Aprobacion', value: (metrics?.approvalRate || 0) + '%', color: '#00bcd4' },
    { label: 'Alertas', value: metrics?.unreadAlerts || 0, color: '#ff9800' },
  ];

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:64}}><div style={{width:48,height:48,border:'4px solid #e5e7eb',borderTop:'4px solid #1a237e',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:32}}>
      <div>
        <h1 style={{fontSize:30,fontWeight:'bold',color:'#111827'}}>Dashboard</h1>
        <p style={{color:'#6b7280',marginTop:4}}>Bienvenido, {user?.fullName}</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:24}}>
        {cards.map((c,i) => (
          <div key={i} style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize:14,color:'#6b7280'}}>{c.label}</p>
            <p style={{fontSize:28,fontWeight:'bold',color:c.color,marginTop:8}}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <h2 style={{fontSize:20,fontWeight:'bold',marginBottom:16}}>Pipeline de Asignaciones</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12}}>
          {pipeline && Object.entries(pipeline).map(([status,count]) => (
            <div key={status} style={{textAlign:'center',padding:16,borderRadius:8,background:statusColors[status]+'15'}}>
              <p style={{fontSize:24,fontWeight:'bold',color:statusColors[status]}}>{count}</p>
              <p style={{fontSize:12,color:'#6b7280',marginTop:4}}>{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 22. FRONTEND — src/pages/Assignments.jsx

Crea `frontend/src/pages/Assignments.jsx` y pega esto:

```javascript
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    axios.get(API + '/api/assignments').then(r => { setAssignments(r.data); setLoading(false); });
  }, []);

  const statusColors = {
    'Borrador':{bg:'#f3f4f6',text:'#374151'},'Asignada':{bg:'#dbeafe',text:'#1e40af'},'En Progreso':{bg:'#fef3c7',text:'#92400e'},
    'Entregada':{bg:'#ffedd5',text:'#9a3412'},'En Validacion':{bg:'#f3e8ff',text:'#6b21a8'},'Evaluada':{bg:'#dcfce7',text:'#166534'},
    'Rechazada':{bg:'#fee2e2',text:'#991b1b'},'Vencida':{bg:'#fecaca',text:'#7f1d1d'}
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:64}}>Cargando...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{fontSize:30,fontWeight:'bold',color:'#111827'}}>Asignaciones</h1>
        {(user?.role === 'secretaria' || user?.role === 'superadmin') && (
          <button style={{padding:'10px 20px',background:'#1a237e',color:'white',border:'none',borderRadius:8,cursor:'pointer'}}>+ Nueva Asignacion</button>
        )}
      </div>

      <div style={{background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f9fafb'}}>
              {['ID','Titulo','Tipo','Estado','Plazo','Acciones'].map(h => (
                <th key={h} style={{padding:'12px 24px',textAlign:'left',fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} style={{borderTop:'1px solid #e5e7eb'}}>
                <td style={{padding:'16px 24px',fontSize:14,fontWeight:500,color:'#111827'}}>{a.assignment_id}</td>
                <td style={{padding:'16px 24px',fontSize:14,color:'#6b7280'}}>{a.title}</td>
                <td style={{padding:'16px 24px',fontSize:14,color:'#6b7280'}}>{a.type}</td>
                <td style={{padding:'16px 24px'}}>
                  <span style={{padding:'4px 12px',borderRadius:9999,fontSize:12,fontWeight:500,background:statusColors[a.status]?.bg,color:statusColors[a.status]?.text}}>{a.status}</span>
                </td>
                <td style={{padding:'16px 24px',fontSize:14,color:'#6b7280'}}>{new Date(a.deadline).toLocaleDateString('es-ES')}</td>
                <td style={{padding:'16px 24px'}}>
                  <Link to={'/assignments/' + a.id} style={{color:'#1a237e',textDecoration:'none',fontWeight:500}}>Ver Detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assignments;
```

---

## 23. FRONTEND — src/pages/AssignmentDetail.jsx

Crea `frontend/src/pages/AssignmentDetail.jsx` y pega esto:

```javascript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    axios.get(API + '/api/assignments/' + id).then(r => setAssignment(r.data));
  }, [id]);

  if (!assignment) return <div style={{padding:64,textAlign:'center'}}>Cargando...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <h1 style={{fontSize:30,fontWeight:'bold',color:'#111827'}}>{assignment.title}</h1>
      <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
          <div><p style={{fontSize:14,color:'#6b7280'}}>ID</p><p style={{fontSize:18,color:'#111827'}}>{assignment.assignment_id}</p></div>
          <div><p style={{fontSize:14,color:'#6b7280'}}>Tipo</p><p style={{fontSize:18,color:'#111827'}}>{assignment.type}</p></div>
          <div><p style={{fontSize:14,color:'#6b7280'}}>Estado</p><p style={{fontSize:18,color:'#111827'}}>{assignment.status}</p></div>
          <div><p style={{fontSize:14,color:'#6b7280'}}>Plazo</p><p style={{fontSize:18,color:'#111827'}}>{new Date(assignment.deadline).toLocaleDateString('es-ES')}</p></div>
        </div>
        <div style={{marginTop:24}}>
          <p style={{fontSize:14,color:'#6b7280'}}>Descripcion</p>
          <p style={{marginTop:8,color:'#374151',lineHeight:1.6}}>{assignment.description}</p>
        </div>
        <div style={{marginTop:16}}>
          <p style={{fontSize:14,color:'#6b7280'}}>Objetivo</p>
          <p style={{marginTop:8,color:'#374151',lineHeight:1.6}}>{assignment.objective}</p>
        </div>
        <div style={{marginTop:16}}>
          <p style={{fontSize:14,color:'#6b7280'}}>Criterios de Evaluacion</p>
          <p style={{marginTop:8,color:'#374151',lineHeight:1.6}}>{assignment.evaluation_criteria}</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
```

---

## 24. FRONTEND — src/pages/Alerts.jsx

Crea `frontend/src/pages/Alerts.jsx` y pega esto:

```javascript
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    axios.get(API + '/api/alerts').then(r => setAlerts(r.data));
  }, []);

  const severityColors = {
    'info': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'warning': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'critical': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
  };

  const markAsRead = async (id) => {
    await axios.patch(API + '/api/alerts/' + id + '/read');
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <h1 style={{fontSize:30,fontWeight:'bold',color:'#111827'}}>Alertas</h1>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {alerts.map(alert => (
          <div key={alert.id} style={{
            background: 'white', borderRadius: 12, padding: 20,
            borderLeft: '4px solid ' + severityColors[alert.severity]?.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            opacity: alert.is_read ? 0.6 : 1
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#6b7280'}}>{alert.code}</span>
                  <span style={{padding:'2px 8px',borderRadius:9999,fontSize:11,fontWeight:500,background:severityColors[alert.severity]?.bg,color:severityColors[alert.severity]?.text}}>{alert.severity}</span>
                </div>
                <p style={{marginTop:8,color:'#111827',fontSize:15}}>{alert.message}</p>
                <p style={{marginTop:4,color:'#9ca3af',fontSize:12}}>{new Date(alert.created_at).toLocaleString('es-ES')}</p>
              </div>
              {!alert.is_read && (
                <button onClick={() => markAsRead(alert.id)} style={{padding:'6px 12px',background:'#1a237e',color:'white',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>
                  Marcar leida
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
```

---

## 25. COMANDOS PARA EJECUTAR (Terminal de VS Code)

### Terminal 1 — Backend:
```bash
cd backend
npm install
# Crear base de datos en MySQL primero (ver paso 26)
npm start
```

### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm start
```

---

## 26. CONFIGURAR MYSQL

Abre MySQL Workbench o terminal MySQL y ejecuta:

```sql
-- Crear usuario (opcional, puedes usar root)
CREATE USER 'minume'@'localhost' IDENTIFIED BY 'minume_password';
GRANT ALL PRIVILEGES ON *.* TO 'minume'@'localhost';
FLUSH PRIVILEGES;

-- Importar la base de datos
-- En terminal: mysql -u root -p < database/minume_xvii.sql
```

O en MySQL Workbench:
1. File > Open SQL Script
2. Selecciona `database/minume_xvii.sql`
3. Click en el rayo (Execute)

---

## 27. CREDENCIALES DE PRUEBA

| Rol | Email | Password |
|-----|-------|----------|
| Superadmin | superadmin@minume-xvii.edu.do | Minume2025! |
| Secretaria | secretaria@minume-xvii.edu.do | Minume2025! |
| Mesa Educacion | mesa.educacion@minume-xvii.edu.do | Minume2025! |
| Mesa Cooperacion | mesa.cooperacion@minume-xvii.edu.do | Minume2025! |
| Delegado 1 | delegado1@minume-xvii.edu.do | Minume2025! |
| Delegado 2 | delegado2@minume-xvii.edu.do | Minume2025! |

---

## 28. ARQUITECTURA DEL SISTEMA

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐     SQL Queries     ┌─────────────────┐
│                 │ ◄────────────────► │                 │ ◄────────────────► │                 │
│   FRONTEND      │                    │    BACKEND      │                    │    DATABASE     │
│   (React.js)    │                    │  (Node.js +     │                    │    (MySQL)      │
│                 │                    │   Express.js)   │                    │                 │
│  Puerto 3000    │                    │   Puerto 3001   │                    │   Puerto 3306   │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
```

| Componente | Puerto | Tecnologia |
|-----------|--------|-----------|
| Frontend | 3000 | React.js |
| Backend API | 3001 | Node.js + Express |
| Database | 3306 | MySQL |
| WebSocket | 3001 | Socket.io |

---

## CHECKLIST FINAL

- [ ] Carpetas creadas en VS Code
- [ ] Archivos del backend copiados (7 archivos)
- [ ] Archivos del frontend copiados (10 archivos)
- [ ] MySQL instalado y corriendo
- [ ] Base de datos importada (minume_xvii.sql)
- [ ] Backend: `npm install` ejecutado
- [ ] Backend: `npm start` corriendo en puerto 3001
- [ ] Frontend: `npm install` ejecutado
- [ ] Frontend: `npm start` corriendo en puerto 3000
- [ ] Login exitoso con credenciales de prueba
