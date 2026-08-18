# 🚀 GUÍA DE DESPLIEGUE EN HOSTINGER - MINUME XVII

> Despliegue completo en **Hostinger VPS/Cloud Hosting** bajo subdominio con **Supabase (PostgreSQL)**

---

## 📋 REQUISITOS PREVIOS

- ✅ Cuenta en **Hostinger** (VPS KVM 2 o superior recomendado)
- ✅ Dominio propio configurado en Hostinger
- ✅ Cuenta en **Supabase** (gratis: 500MB DB, 1GB bandwidth)
- ✅ Node.js 18+ y npm instalados localmente
- ✅ Git instalado

---

## 🗄️ PASO 1: CONFIGURAR SUPABASE (POSTGRESQL)

### 1.1 Crear proyecto en Supabase
1. Ve a https://supabase.com/dashboard
2. **New Project** → Organization → Nombre: `minume-xvii`
3. **Database Password**: genera uno seguro (guárdalo)
4. **Region**: elige la más cercana a tus usuarios (ej. South America - São Paulo)
5. Espera 2-3 min a que se aprovisione

### 1.2 Obtener credenciales de conexión
En **Settings → Database**:
```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: TU_PASSWORD_AQUI
```

### 1.3 Ejecutar script SQL
1. Ve a **SQL Editor → New Query**
2. Copia y pega todo el contenido de `database/supabase_minume_xvii.sql`
3. **Run** → Verifica que no haya errores
4. Verifica en **Table Editor** que existan 7 tablas con datos semilla

### 1.4 (Opcional) Configurar Connection Pooling
En **Settings → Database → Connection Pooling**:
- **Mode**: Transaction
- **Pool Size**: 20
- Usa el host `aws-0-xxx.pooler.supabase.com` puerto `6543` para mejor performance

---

## 🌐 PASO 2: CONFIGURAR SUBDOMINIOS EN HOSTINGER

### 2.1 Crear subdominios en hPanel
Ve a **Dominios → Subdominios** y crea:

| Subdominio | Apunta a | Uso |
|------------|----------|-----|
| `minume.tudominio.com` | `/public_html/minume` | Frontend React |
| `api-minume.tudominio.com` | `/public_html/minume-api` | Backend Node.js |

> **Nota**: Si usas **VPS**, configura en **DNS Zone Editor** registros A apuntando a tu IP del VPS.

### 2.2 SSL (HTTPS)
- En **SSL → Force HTTPS** → Actívalo para ambos subdominios
- Espera 5-10 min a que se propague el certificado Let's Encrypt

---

## 💻 PASO 3: PREPARAR VPS (si usas VPS Hostinger)

### 3.1 Conectar por SSH
```bash
ssh root@TU_IP_VPS
```

### 3.2 Instalar dependencias del sistema
```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx
```

### 3.3 Instalar Node.js 20 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 3.4 Instalar PM2 globalmente
```bash
npm install -g pm2
pm2 startup systemd -u root --hp /root
```

---

## 📦 PASO 4: DESPLEGAR BACKEND (API)

### 4.1 Clonar repositorio en el servidor
```bash
cd /var/www
git clone https://github.com/TU_USUARIO/MINUME-ROOM.git minume-api
cd minume-api/backend
```

### 4.2 Instalar dependencias
```bash
npm ci --production
```

### 4.3 Configurar variables de entorno
```bash
cp .env.production .env
nano .env
```

**Completa con tus valores reales:**
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://minume.tudominio.com

# SUPABASE - Usa los valores del Paso 1.2
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=TU_SUPABASE_DB_PASSWORD
DB_NAME=postgres

# JWT - Genera uno seguro: openssl rand -base64 32
JWT_SECRET=TU_JWT_SECRET_32_CHARS_MINIMO
JWT_EXPIRES_IN=24h
```

### 4.4 Probar conexión a DB y iniciar
```bash
node -e "require('./config/db').query('SELECT NOW()').then(r=>console.log('DB OK:', r.rows[0])).catch(e=>console.error('DB ERROR:', e))"
pm2 start server.js --name minume-api
pm2 save
```

### 4.5 Verificar logs
```bash
pm2 logs minume-api
# Debe mostrar: "MINUME XVII backend corriendo en http://localhost:3001"
```

---

## 🌍 PASO 5: CONFIGURAR NGINX (REVERSE PROXY)

### 5.1 Crear configuración para API
```bash
nano /etc/nginx/sites-available/api-minume.tudominio.com
```

```nginx
server {
    listen 80;
    server_name api-minume.tudominio.com;

    # Redirigir a HTTPS (Certbot lo hará automático)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para WebSockets
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### 5.2 Crear configuración para Frontend
```bash
nano /etc/nginx/sites-available/minume.tudominio.com
```

```nginx
server {
    listen 80;
    server_name minume.tudominio.com;
    root /var/www/minume-frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API calls to backend (opcional si usas subdominio separado)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.3 Habilitar sitios y obtener SSL
```bash
ln -s /etc/nginx/sites-available/api-minume.tudominio.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/minume.tudominio.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Obtener certificados SSL
certbot --nginx -d api-minume.tudominio.com -d minume.tudominio.com
```

---

## ⚛️ PASO 6: DESPLEGAR FRONTEND (REACT)

### 6.1 Build local (en tu máquina)
```bash
cd frontend
cp .env.production .env.production.local
# Edita .env.production.local con tu URL real:
# REACT_APP_API_URL=https://api-minume.tudominio.com

npm ci
npm run build:prod
```

### 6.2 Subir build al servidor
**Opción A: VPS (scp/rsync)**
```bash
# Desde tu máquina local
scp -r build/* root@TU_IP_VPS:/var/www/minume-frontend/build/
```

**Opción B: Hosting Compartido (File Manager / FTP)**
1. Comprime la carpeta `build` en `.zip`
2. Sube a `/public_html/minume/` via File Manager
3. Extrae allí

### 6.3 Verificar
- Visita `https://minume.tudominio.com` → Debe cargar la app
- Abre DevTools → Network → Verifica que las llamadas a API van a `https://api-minume.tudominio.com/api/...`

---

## 🔧 PASO 7: CONFIGURAR PM2 PARA AUTO-REINICIO

```bash
pm2 startup
# Copia y ejecuta el comando que te muestra

pm2 save
pm2 list
```

Verifica que persista tras reinicio:
```bash
reboot
# Espera 30 seg y verifica:
pm2 list
curl https://api-minume.tudominio.com/health
```

---

## ✅ PASO 8: VERIFICACIONES FINALES

### 8.1 Health Checks
```bash
# Backend
curl https://api-minume.tudominio.com/health
# {"status":"OK","database":"connected","environment":"production"}

# Frontend
curl -I https://minume.tudominio.com
# HTTP/2 200
```

### 8.2 Probar login
1. Ve a `https://minume.tudominio.com`
2. Login con:
   - `superadmin@minume-xvii.edu.do` / `Minume2025!`
3. Verifica que cargue el dashboard y WebSockets funcionen (icono de conexión verde)

### 8.3 Verificar CORS
En consola del navegador (F12):
```javascript
fetch('https://api-minume.tudominio.com/health').then(r=>r.json()).then(console.log)
```
No debe haber errores de CORS.

---

## 📝 ARCHIVOS CLAVE CREADOS/MODIFICADOS

```
MINUME ROOM/
├── backend/
│   ├── .env.production          # ← COMPLETAR CON TUS VALORES
│   ├── package.json             # ← pg en lugar de mysql2
│   ├── config/
│   │   ├── db.js               # ← PostgreSQL (pg pool)
│   │   └── bootstrap.js        # ← Sintaxis PostgreSQL
│   └── server.js               # ← Helmet CSP, graceful shutdown
├── frontend/
│   ├── .env.production         # ← REACT_APP_API_URL
│   └── package.json            # ← homepage: ".", build:prod
├── database/
│   └── supabase_minume_xvii.sql # ← SQL para Supabase
└── DESPLIEGUE_HOSTINGER.md      # ← ESTA GUÍA
```

---

## 🚨 TROUBLESHOOTING COMÚN

| Problema | Solución |
|----------|----------|
| `ECONNREFUSED` a DB | Verifica `DB_HOST` y que Supabase acepte conexiones (Settings → Database → Allow incoming connections) |
| Error CORS | Verifica `FRONTEND_URL` en backend coincide exactamente con tu subdominio (incluye `https://`) |
| WebSocket no conecta | Nginx debe tener `proxy_set_header Upgrade $http_upgrade;` y `proxy_read_timeout 86400;` |
| Build React muestra página en blanco | Verifica `homepage: "."` en package.json y que `index.html` esté en la raíz del subdominio |
| `JWT_SECRET` error | Debe tener mínimo 32 caracteres. Genera: `openssl rand -base64 32` |
| PM2 no inicia tras reboot | Ejecuta `pm2 startup` y el comando que muestra, luego `pm2 save` |

---

## 🔐 CHECKLIST DE SEGURIDAD POST-DESPLIEGUE

- [ ] Cambiar contraseñas de usuarios por defecto
- [ ] Configurar **Row Level Security (RLS)** en Supabase para tablas sensibles
- [ ] Habilitar **Rate Limiting** estricto en producción (ya configurado: 100 req/15min)
- [ ] Configurar backups automáticos en Supabase (Settings → Database → Backups)
- [ ] Monitorear logs: `pm2 logs minume-api --lines 100`
- [ ] Configurar alertas de uptime (UptimeRobot, Better Stack)

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa logs: `pm2 logs minume-api`
2. Verifica health: `curl https://api-minume.tudominio.com/health`
3. Revisa Nginx: `tail -f /var/log/nginx/error.log`

---

**¡Listo! Tu plataforma MINUME XVII está corriendo en producción 🎉**