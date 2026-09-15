@echo off
title Ajedrito - Servicio de IA (Python FastAPI)
echo ==============================================
echo   Iniciando Servicio de IA Propia (Puerto 8000)
echo ==============================================
cd /d "%~dp0ai"
call .venv\Scripts\activate.bat
uvicorn src.main:app --reload --port 8000 --host 127.0.0.1
pause
