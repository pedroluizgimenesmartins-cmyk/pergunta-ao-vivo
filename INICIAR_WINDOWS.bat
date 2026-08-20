@echo off
title Pergunta ao Vivo
where node >nul 2>nul
if errorlevel 1 (
 echo.
 echo Node.js nao encontrado.
 echo Instale o Node.js e execute este arquivo novamente.
 pause
 exit /b
)
if not exist node_modules npm install
start "" http://localhost:3000
npm start
