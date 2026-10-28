@echo off
title PMOC ClimaSync - Servidor Local
chcp 65001 > nul
cls
echo ========================================================
echo      PMOC CLIMASYNC - SISTEMA DE GESTAO VIA QR CODE
echo ========================================================
echo.
echo [1/2] Iniciando o servidor Node.js...
start "" "http://localhost:3000"
echo [2/2] Abrindo navegador em http://localhost:3000 ...
echo.
echo Pressione Ctrl+C para encerrar o servidor.
echo.
node server.js
pause
