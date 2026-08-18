@echo off
setlocal

echo ============================================
echo    MINUME XVII - Inicio Local
echo ============================================
echo.

echo Verificando MySQL...
mysql -u root -padmin12 -e "SELECT 1" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL no esta corriendo o la contrasena es incorrecta.
    echo Inicia MySQL y presiona cualquier tecla...
    pause >nul
    exit /b 1
)
echo [OK] MySQL conectado.
echo.

echo Iniciando Backend (puerto 3001)...
start "Backend" cmd /c "cd /d backend && node server.js"
timeout /t 5 >nul

echo Iniciando Frontend (puerto 3000)...
start "Frontend" cmd /c "cd /d frontend && npm start"
timeout /t 10 >nul

echo.
echo ============================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Credenciales:
echo   superadmin@minume-xvii.edu.do / Minume2025!
echo ============================================
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start "" "http://localhost:3000"

endlocal