# MINUME ROOM XVII

Plataforma académica full stack: gestión de comisiones, asignaciones, entregas, evaluaciones y alertas por rol.

- **Backend:** Node.js + Express + Socket.IO (ESM) en `backend/src/`
- **Frontend:** React (código fuente en `frontend/`, compilado y servido desde `backend/public/`)
- **Base de datos:** PostgreSQL (Supabase)

# El backend sirve el frontend ya compilado, así que un solo proceso atiende la web y la API en el mismo origen.

## Estructura

```text
MINUME ROOM/
├── index.js                 # Punto de entrada (arranca backend/src/server.js)
├── package.json             # Dependencias + scripts (start / build)
├── backend/
│   ├── src/                 # Servidor Express (ESM): rutas, middleware, db, bootstrap
│   └── public/              # Frontend React ya compilado (lo sirve el servidor)
├── frontend/                # Código fuente React (para modificar la interfaz)
└── database/
    └── supabase_minume_xvii.sql   # Esquema de referencia (las tablas se crean solas al arrancar)
```