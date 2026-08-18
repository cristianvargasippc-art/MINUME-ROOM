import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join, basename } from "path";
import { existsSync } from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import { db, pool } from "./db.js";
import { bootstrapDatabase } from "./config/bootstrap.js";
import authRoutes from "./routes/auth.js";
import assignmentRoutes from "./routes/assignments.js";
import dashboardRoutes from "./routes/dashboard.js";
import alertRoutes from "./routes/alerts.js";
import commissionRoutes from "./routes/commissions.js";
import errorHandler from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const requiredEnvVars = ["JWT_SECRET"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.APP_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOriginSet = new Set(allowedOrigins);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const normalized = new URL(origin).origin.replace(/\/$/, "");
    return allowedOriginSet.has(normalized);
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
};

const helmetConfig = {
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameAncestors: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
};

app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(join(__dirname, "..", "uploads")));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 100 : 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes, intente más tarde" },
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  socket.on("join_room", (room) => socket.join(room));
  socket.on("disconnect", () => console.log(`Cliente desconectado: ${socket.id}`));
});

app.set("io", io);

app.get("/api/health", async (_req, res) => {
  try {
    const conn = await db.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    return res.json({ status: "OK", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(503).json({ status: "ERROR", database: "disconnected", timestamp: new Date().toISOString() });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/commissions", commissionRoutes);

function getCandidateFrontendPaths() {
  const paths = [];
  if (process.env.FRONTEND_DIST) paths.push(process.env.FRONTEND_DIST);
  if (process.env.PUBLIC_DIR) paths.push(process.env.PUBLIC_DIR);
  if (process.env.STATIC_PATH) paths.push(process.env.STATIC_PATH);

  paths.push(join(__dirname, "public"));
  paths.push(join(__dirname, "dist"));
  paths.push(join(__dirname, "..", "public"));
  paths.push(join(__dirname, "..", "dist"));

  const bases = [__dirname, process.cwd(), join(__dirname, ".."), join(process.cwd(), "..")];
  for (const base of bases) {
    if (!base) continue;
    let curr = base;
    for (let i = 0; i < 5; i++) {
      paths.push(join(curr, "frontend", "dist"));
      paths.push(join(curr, "frontend", "build"));
      paths.push(join(curr, "dist"));
      paths.push(join(curr, "public"));
      paths.push(join(curr, "public_html"));
      paths.push(join(curr, "public_html", "frontend", "dist"));
      paths.push(join(curr, "public_html", "dist"));
      paths.push(join(curr, "backend", "dist"));
      paths.push(join(curr, "backend", "public"));
      const parent = join(curr, "..");
      if (parent === curr) break;
      curr = parent;
    }
  }
  return [...new Set(paths)];
}

function resolveFrontendPath() {
  const candidates = getCandidateFrontendPaths();
  for (const p of candidates) {
    const folderName = basename(p).toLowerCase();
    const allowedStaticFolder = ["dist", "public", "public_html", "build"].includes(folderName);
    if (allowedStaticFolder && existsSync(join(p, "index.html"))) {
      return p;
    }
  }
  return candidates[0] || join(__dirname, "..", "dist");
}

const frontendPath = resolveFrontendPath();
app.use(express.static(frontendPath, { dotfiles: "ignore", etag: true, fallthrough: true, index: false }));

app.get("*", (_req, res) => {
  const activePath = resolveFrontendPath();
  const indexPath = join(activePath, "index.html");
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).type("html").send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MINUME XVII - Servidor Activo</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; max-width: 650px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 1.5rem; }
        p { line-height: 1.6; color: #94a3b8; }
        code { background: #0f172a; color: #f43f5e; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.85em; word-break: break-all; }
        .status { display: inline-block; background: #0369a1; color: #e0f2fe; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="status">Backend Activo (API OK)</span>
        <h1>MINUME XVII - Servidor En Ejecución</h1>
        <p>El servicio API del Backend está funcionando correctamente. Para visualizar la interfaz de usuario, se requiere compilar el frontend ejecutando:</p>
        <p><code>npm run build</code></p>
      </div>
    </body>
    </html>
  `);
});

app.use(errorHandler);

function startServer(currentPort) {
  const server = httpServer.listen(currentPort, () => {
    console.log(`MINUME XVII backend corriendo en http://localhost:${currentPort}`);
    console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
    console.log(`Frontend URL: ${process.env.APP_URL || "http://localhost:3000"}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      if (process.env.NODE_ENV === "production") {
        console.error("El puerto configurado ya esta en uso", { port: currentPort });
        process.exit(1);
      }
      const fallbackPort = currentPort + 1;
      console.warn(`Puerto ${currentPort} en uso, intentando con ${fallbackPort}`);
      startServer(fallbackPort);
      return;
    }
    console.error("Error al iniciar el servidor", { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    console.log("Servidor HTTP cerrado.");
    try {
      await pool.end();
      console.log("Pool de base de datos cerrado.");
      process.exit(0);
    } catch (error) {
      console.error("Error cerrando pool:", error);
      process.exit(1);
    }
  });
  setTimeout(() => { console.error("Forzando cierre"); process.exit(1); }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

bootstrapDatabase()
  .then(() => startServer(port))
  .catch((error) => {
    console.error("No se pudo iniciar el backend:", error);
    process.exit(1);
  });