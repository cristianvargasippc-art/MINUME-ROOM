@echo off
setlocal
rem ============================================
rem  MINUME XVII - Mantenedor de tunel (localtunnel)
rem  Mantiene activo el enlace publico y lo
rem  reinicia si se cae. El enlace actual se
rem  guarda en tunnel-current.txt
rem ============================================

cd /d "%~dp0"
set LT=C:\Users\Owner\AppData\Roaming\npm\lt.cmd

:loop
echo [%date% %time%] Comprobando tunel...
if not exist "tunnel-current.txt" goto start_tunnel

set /p CURRENT=<tunnel-current.txt
echo URL actual: %CURRENT%
echo [%date% %time%] Probando %CURRENT% ...

curl -s -m 10 -o nul -w "%%{http_code}" "%CURRENT%" > tunnel-check.txt 2>nul
set /p CODE=<tunnel-check.txt

if "%CODE%"=="200" (
    echo [%date% %time%] Tunel OK (200)
    timeout /t 30 >nul
    goto loop
)

echo [%date% %time%] Tunel caido (codigo: %CODE%). Reiniciando...

:start_tunnel
del "tunnel-current.txt" >nul 2>nul
del "tunnel.log" >nul 2>nul

echo [%date% %time%] Iniciando nuevo tunel...
start /b "" "%LT%" --port 3001 > tunnel.log 2>&1

timeout /t 8 >nul

set "URL="
for /f "tokens=*" %%a in ('findstr "your url is:" tunnel.log 2^>nul') do set "URL=%%a"
set "URL=%URL:*your url is: =%"

if not defined URL (
    echo [%date% %time%] No se pudo obtener URL del tunel. Reintentando...
    timeout /t 5 >nul
    goto start_tunnel
)

echo %URL%> tunnel-current.txt
echo [%date% %time%] Nuevo tunel: %URL%
timeout /t 10 >nul
goto loop