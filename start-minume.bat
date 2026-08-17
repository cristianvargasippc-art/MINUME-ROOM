@echo off
setlocal

echo ============================================
echo MINUME XVII - frontend 3000 y backend 3001
echo ============================================

echo.
echo Abriendo frontend en http://localhost:3000 ...
start "MINUME Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo Abriendo backend en http://localhost:3001 ...
start "MINUME Backend" cmd /k "cd /d %~dp0backend && npm start"
