# Despliegue en Hostinger + Supabase

Guía para publicar **MINUME XVII** en Hostinger con dominio propio y base de
datos en Supabase (PostgreSQL).

> La app es **un solo proceso Node.js/Express** que sirve la API **y** el
> frontend React ya compilado (`backend/public/`) en el mismo dominio.
> Usa **Socket.IO (WebSockets)**, así que necesita un plan de Hostinger con
> **aplicación Node.js persistente** (VPS/Cloud/Node app), no hosting estático.

---

## 1. Base de datos — Supabase

1. Crea un proyecto en <https://supabase.com> y guarda la **contraseña** de la BD.
2. **Project Settings → Database → Connection string → Session Pooler**.
   Copia la URL (host `aws-0-<region>.pooler.supabase.com`, puerto **5432**).
   - Usa el **Session Pooler** (IPv4). La conexión directa `db.<ref>.supabase.co`
     es solo IPv6 y Hostinger no la alcanza.
3. **SQL Editor** → ejecuta `database/supabase_minume_xvii.sql` para crear las
   tablas y **los usuarios de prueba**.
   - Las tablas se crean solas al arrancar (`bootstrap.js`), pero **los usuarios
     de login NO se siembran solos**: hay que correr el SQL o nadie podrá entrar.
   - Si necesitas restablecer contraseñas seed: `database/reset_seed_passwords.sql`.

---

## 2. Hostinger — configuración del deploy (import desde GitHub)

| Campo | Valor |
|-------|-------|
| Framework preset | **Express** |
| Branch | `main` |
| Node version | `20.x` |
| Root directory | `./` |
| Package manager | `npm` |
| Entry file | `index.js` |

- **No** definas `PORT`: Hostinger lo asigna y el server lee `process.env.PORT`.
- No hay paso de build obligatorio: el frontend ya viene compilado en `backend/public/`.

---

## 3. Variables de entorno (panel de Hostinger → "Add")

Cárgalas en el panel, **nunca** en el repositorio.

| Clave | Obligatoria | Valor |
|-------|:---:|-------|
| `NODE_ENV` | Sí | `production` |
| `APP_URL` | Sí | `https://minume.celider10.digital` |
| `DATABASE_URL` | Sí | connection string del **Session Pooler** de Supabase |
| `JWT_SECRET` | **Sí** (sin ella el server no arranca) | cadena aleatoria ≥32 caracteres |
| `JWT_EXPIRES_IN` | No | `24h` |

> Ojo: el código lee **`APP_URL`** (para CORS y Socket.IO), **no** `FRONTEND_URL`.

Generar un `JWT_SECRET`:

```bash
openssl rand -base64 32
```

---

## 4. Dominio y SSL

- El deploy apunta a `minume.celider10.digital`.
- Si el dominio está en Hostinger, el DNS se resuelve automáticamente; si es
  externo, apunta los registros **A/CNAME** al destino que indique Hostinger.
- Activa **SSL (HTTPS)** en hPanel. `APP_URL` debe ir con `https://`.

---

## 5. Verificación post-deploy

1. `https://minume.celider10.digital/api/health` →
   `{"status":"OK","database":"connected"}`.
2. Inicia sesión con `superadmin@minume-xvii.edu.do` / `Minume2025!`.
3. Si sale `"database":"disconnected"` → revisa `DATABASE_URL` (usa el **pooler**,
   puerto 5432, y verifica usuario/contraseña).
4. Si el login del navegador falla por CORS → revisa que `APP_URL` sea
   **exactamente** el dominio con `https://` y sin barra final.

---

## Manejo de secretos (patrón del repo)

- ✅ Se versiona `backend/.env.example` y `backend/.env.production` → **plantillas sin valores reales**.
- 🚫 **Nunca** se versiona `backend/.env` (ya está en `.gitignore`) → valores reales solo en local.
- ☁️ En producción no se sube ningún `.env`: los valores viven en el panel de Hostinger.
