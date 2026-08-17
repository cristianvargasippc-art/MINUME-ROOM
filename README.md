# MINUME XVII

Implementacion completa basada en la guia `GUÍA_VS_CODE_COMPLETA.md`, organizada como una plataforma full stack con:

- `frontend/`: React + React Router
- `backend/`: Node.js + Express + Socket.IO
- `database/`: script SQL para MySQL

## Estructura

```text
MINUME_XVII_Guia_VS_Code/
├── backend/
├── frontend/
├── database/
├── GUÍA_VS_CODE_COMPLETA.md
└── README.md
```

## Variables de entorno

Backend:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena_mysql
DB_NAME=minume_xvii
JWT_SECRET=minume_xvii_secret_key_2026_super_segura
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

Frontend:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Instalacion

1. Importa [database/minume_xvii.sql](/c:/Users/Owner/Downloads/MINUME_XVII_Guia_VS_Code/database/minume_xvii.sql) en MySQL.
2. Instala dependencias del backend:

```bash
cd backend
npm install
```

3. Instala dependencias del frontend:

```bash
cd frontend
npm install
```

## Ejecucion

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm start
```

Arranque rapido en desarrollo:

```bash
start-minume.bat
```

Ese script levanta:

- frontend en `http://localhost:3000/`
- backend en `http://localhost:3001/`

## Credenciales de prueba

- `superadmin@minume-xvii.edu.do` / `Minume2025!`
- `secretaria@minume-xvii.edu.do` / `Minume2025!`
- `mesa.educacion@minume-xvii.edu.do` / `Minume2025!`
- `mesa.cooperacion@minume-xvii.edu.do` / `Minume2025!`
- `delegado1@minume-xvii.edu.do` / `Minume2025!`
- `delegado2@minume-xvii.edu.do` / `Minume2025!`

## Notas

- El frontend fue estilizado con una capa visual mas profesional que la version base de la guia.
- El backend incluye `health check`, `rate limit`, `helmet`, `cors` configurable y utilidades para scoping por rol.
- Si vas a usar otro host o puerto, ajusta `FRONTEND_URL` y `REACT_APP_API_URL`.
