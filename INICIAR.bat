@echo off
title Catálogo de productos - Servidor
cd /d "%~dp0"
echo ============================================
echo   Catálogo de productos
echo ============================================
echo.
echo Reiniciando base de datos...
call npm run db:reset
echo.
echo Iniciando servidor...
echo Abre tu navegador en: http://localhost:3000
echo.
echo (No cierres esta ventana mientras uses la app)
echo.
start http://localhost:3000
npm run dev
pause