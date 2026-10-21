@echo off
title A.R.P.O. TierMaker
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js.
  echo Instalalo desde https://nodejs.org y vuelve a intentarlo.
  pause
  exit /b 1
)
if not exist "%~dp0server.js" (
  echo No se encontro server.js en esta carpeta.
  pause
  exit /b 1
)
echo Iniciando A.R.P.O. TierMaker...
echo.
node "%~dp0server.js"
echo.
echo El servidor se ha detenido.
pause