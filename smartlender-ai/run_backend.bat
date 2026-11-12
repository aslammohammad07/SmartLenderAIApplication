@echo off
title SmartLenderAI Backend
cd /d %~dp0backend
echo Starting SmartLenderAI Flask API Server on http://127.0.0.1:5000...
python app.py
pause
