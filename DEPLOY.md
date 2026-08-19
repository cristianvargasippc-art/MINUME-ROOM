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
   tablas y las cuentas iniciales.
   - Las tablas se crean solas al arrancar (`bootstrap.js`), pero **las cuentas
     de login NO se siembran solas**: hay que correr el SQL o nadie podrá entrar.
   - Se crean **bloqueadas a propósito**: su hash no corresponde a ninguna
     contraseña conocida, así que todavía no se puede entrar con ellas.

4. **Asigna contraseñas** (obligatorio: sin esto nadie puede iniciar sesión):

   ```bash
   node database/generate_seed_passwords.js
   ```

   Imprime contraseñas nuevas y las sentencias `UPDATE` ya rellenadas. Pega el SQL
   en el editor de Supabase y **guarda las contraseñas en un gestor**: no se
   pueden recuperar, solo volver a rotar. Guía en
   `database/reset_seed_passwords.sql`.

> ⚠️ **Si ya desplegaste una versión anterior a esta:** las cuentas iniciales
> compartían el hash de una contraseña que estaba escrita en este repositorio, y
> el alta de integrantes asignaba esa misma contraseña a cada cuenta nueva.
> Cualquiera con acceso al repositorio podía entrar como `superadmin` o como
> cualquier integrante. **Rota todas las contraseñas ya.**

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
2. Inicia sesión con `superadmin@minume-xvii.edu.do` y la contraseña que generaste
   en el paso 1.4.
3. Si sale `"database":"disconnected"` → revisa `DATABASE_URL` (usa el **pooler**,
   puerto 5432, y verifica usuario/contraseña).
4. Si el login del navegador falla por CORS → revisa que `APP_URL` sea
   **exactamente** el dominio con `https://` y sin barra final.

---

## 6. Si alguna vez se reescribe el historial de git

Reescribir commits ya publicados (por ejemplo con `git filter-branch` para
limpiar metadatos de los mensajes) cambia el SHA de **todos** los commits
siguientes y obliga a un `git push --force-with-lease`.

- **Hostinger** importa la rama `main` desde GitHub y la vuelve a traer
  completa, así que se realinea solo en el siguiente despliegue: no hay que
  tocar nada en el panel. Para confirmarlo, comprueba que el sitio ya sirve el
  bundle esperado:

  ```bash
  curl -s https://minume.celider10.digital/ | grep -o 'src="/static[^"]*"'
  ```

  Debe coincidir con el nombre del archivo que hay en `backend/public/static/js/`.

- **Copias locales del repositorio** (otra máquina, otra carpeta) sí necesitan
  alinearse a mano. Un `git pull` normal intentaría fusionar el historial viejo
  con el nuevo y duplicaría los commits:

  ```bash
  git fetch origin
  git reset --hard origin/main
  ```

  Guarda antes cualquier cambio sin commitear (`git stash`): `reset --hard` los
  descarta sin preguntar.

---

## Manejo de secretos (patrón del repo)

- ✅ Se versiona `backend/.env.example` y `backend/.env.production` → **plantillas sin valores reales**.
- 🚫 **Nunca** se versiona `backend/.env` (ya está en `.gitignore`) → valores reales solo en local.
- ☁️ En producción no se sube ningún `.env`: los valores viven en el panel de Hostinger.
