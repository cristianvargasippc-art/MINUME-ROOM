# MINUME ROOM XVII

Plataforma académica full stack: gestión de comisiones, asignaciones, entregas y evaluaciones.

- **Backend:** Node.js + Express + Socket.IO
- **Frontend:** React (compilado y servido desde backend)
- **Base de datos:** PostgreSQL (Supabase)

## Quick Start

### Local
```bash
npm install
npm run dev        # backend en :3001
npm run dev:frontend   # frontend en :3000
```

### Variables de entorno
Copia `backend/.env.example` a `backend/.env` y rellena:
- `DATABASE_URL` (Supabase pooler)
- `JWT_SECRET` (cadena aleatoria ≥32 chars)
- `APP_URL` (http://localhost:3001 en local)

### Producción
Despliega en Hostinger. Ver `DEPLOY.md` para detalles.

---

**Documentación completa:** `DEPLOY.md` | **Base de datos:** `database/supabase_minume_xvii.sql`
