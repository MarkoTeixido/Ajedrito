@echo off
title Ajedrito - Seeding Real de Lichess (Cold Start)
echo =================================================================
echo   Descarga e Insercion Masiva de Partidas de Lichess por Niveles
echo =================================================================
cd /d "%~dp0ai"
call .venv\Scripts\activate.bat
python -m src.data.seed_lichess_dataset
echo.
echo Reentrenando modelo con el nuevo dataset...
python -m src.ml.trainer
echo.
pause
