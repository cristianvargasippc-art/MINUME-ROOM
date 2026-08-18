require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const db = require('./config/db');
const { bootstrapDatabase } = require('./config/bootstrap');
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const commissionRoutes = require('./routes/commissions');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const httpServer = createServer(app);
const frontendBuildPath = path.resolve(__dirname, '../frontend/build');
const hasFrontendBuild = fs.existsSync(path.join(frontendBuildPath, 'index.html'));

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const configuredOrigins = frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];
const privateNetworkOriginPattern = /^https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?$/;
const allowedOrigins = new Set([...configuredOrigins, ...localOrigins]);

app.set('trust proxy', 1);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has('*')) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production' && privateNetworkOriginPattern.test(origin)) {
    return true;
  }

  return false;
};

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false
  })
);

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

app.set('io', io);

app.get('/health', async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();

    return res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/commissions', commissionRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT || 3001);
bootstrapDatabase()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`MINUME XVII backend corriendo en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el backend:', error);
    process.exit(1);
  });
