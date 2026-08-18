# ⚡ COMANDOS RÁPIDOS - DESPLIEGUE MINUME XVII

## 🖥️ EN TU MÁQUINA LOCAL (Build & Push)

```bash
# 1. Build frontend para producción
cd frontend
cp .env.production .env.production.local
# Edita REACT_APP_API_URL=https://api-minume.tudominio.com
npm ci && npm run build:prod

# 2. Subir a VPS (ejemplo con scp)
scp -r build/* root@TU_IP_VPS:/var/www/minume-frontend/build/

# 3. Push cambios a Git (para deploy en servidor)
git add . && git commit -m "deploy: config producción" && git push
```

---

## 🌐 EN EL SERVIDOR VPS (Hostinger)

### Primera vez (Setup completo)
```bash
# 1. Clonar repo
cd /var/www && git clone https://github.com/TU_USUARIO/MINUME-ROOM.git minume-api
cd minume-api/backend

# 2. Instalar deps producción
npm ci --production

# 3. Configurar .env
cp .env.production .env
nano .env  # ← COMPLETAR TODOS LOS VALORES

# 4. Probar DB
node -e "require('./config/db').query('SELECT NOW()').then(r=>console.log('DB OK:',r.rows[0])).catch(e=>console.error(e))"

# 5. Iniciar con PM2
pm2 start server.js --name minume-api
pm2 save
pm2 startup  # ← Ejecuta el comando que muestra

# 6. Configurar Nginx + SSL (ver guía completa)
```

### Actualizaciones posteriores
```bash
cd /var/www/minume-api
git pull
cd backend
npm ci --production
pm2 restart minume-api
```

### Frontend updates
```bash
# En tu máquina local
cd frontend && npm run build:prod
scp -r build/* root@TU_IP_VPS:/var/www/minume-frontend/build/
```

---

## 🔍 MONITOREO Y DEBUG

```bash
# Ver logs en tiempo real
pm2 logs minume-api --lines 100

# Estado de procesos
pm2 list
pm2 monit

# Health check
curl https://api-minume.tudominio.com/health

# Reiniciar backend
pm2 restart minume-api

# Ver configuración PM2
pm2 show minume-api

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🗄️ SUPABASE - COMANDOS ÚTILES

```bash
# Conexión directa (psql)
psql "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# Ver tablas
\dt

# Ver usuarios
SELECT email, role, commission_id FROM users;

# Resetear contraseña (ejemplo)
UPDATE users SET password = '$2a$12$NEW_HASH' WHERE email = 'superadmin@minume-xvii.edu.do';
```

---

## 📋 VARIABLES CRÍTICAS A CONFIGURAR

| Variable | Dónde | Valor ejemplo |
|----------|-------|---------------|
| `FRONTEND_URL` | backend/.env | `https://minume.tudominio.com` |
| `REACT_APP_API_URL` | frontend/.env.production | `https://api-minume.tudominio.com` |
| `DB_HOST` | backend/.env | `db.xxx.supabase.co` |
| `DB_PASSWORD` | backend/.env | `tu_password_supabase` |
| `JWT_SECRET` | backend/.env | `openssl rand -base64 32` |

---

## 🚨 ROLLBACK RÁPIDO

```bash
# Backend: volver al commit anterior
cd /var/www/minume-api
git log --oneline -5
git checkout COMMIT_ANTERIOR -- backend/
cd backend && npm ci --production && pm2 restart minume-api

# Frontend: restaurar build anterior (si tienes backup)
# O rebuild del commit anterior
```