# MINUME XVII

Plataforma académica full stack: gestión de comisiones, asignaciones, entregas, evaluaciones y alertas por rol.

- **Backend:** Node.js + Express + Socket.IO (ESM) en `backend/src/`
- **Frontend:** React (código fuente en `frontend/`, compilado y servido desde `backend/public/`)
- **Base de datos:** PostgreSQL (Supabase)

El backend sirve el frontend ya compilado, así que **un solo proceso** atiende la web y la API en el mismo origen.

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

## Variables de entorno

El servidor las lee del entorno (en Hostinger: panel → Environment variables). No agregues `PORT`; el host lo asigna.

| Clave | Ejemplo |
|-------|---------|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://minume.celider10.digital` |
| `DATABASE_URL` | `postgresql://postgres.REF:PASSWORD@aws-0-...pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | cadena aleatoria de ≥32 caracteres |
| `JWT_EXPIRES_IN` | `24h` |

## Ejecución local

```bash
npm install
npm start
```

Luego abre `http://localhost:3000`. El servidor crea las tablas y siembra los datos base automáticamente en el primer arranque.

Comprobación rápida: `GET /api/health` → `{"status":"OK","database":"connected"}`.

## Cuentas iniciales

El esquema crea estas cuentas **bloqueadas**: su hash no corresponde a ninguna
contraseña conocida, así que hay que asignarles una antes de poder entrar.

- `superadmin@minume-xvii.edu.do`
- `secretaria@minume-xvii.edu.do`
- `mesa.educacion@minume-xvii.edu.do` · `mesa.cooperacion@minume-xvii.edu.do`
- `delegado1@minume-xvii.edu.do` · `delegado2@minume-xvii.edu.do`

Para asignarles contraseña:

```bash
node database/generate_seed_passwords.js
```

Imprime contraseñas nuevas y el SQL listo para pegar en Supabase. Guárdalas en un
gestor de contraseñas: no se pueden recuperar, solo volver a rotar.

## Modificar la interfaz

El frontend servido vive compilado en `backend/public/`. Para cambiarlo, edita `frontend/`, recompila y copia el resultado:

```bash
cd frontend
npm install
npm run build:prod
```

Luego reemplaza el contenido de `backend/public/` con el de `frontend/build/`.
