@echo off
chcp 65001 > nul
cd /d "%~dp0"
start "" "http://localhost:5180"
"C:\Program Files\nodejs\npm.cmd" run dev -- --host localhost --port 5180 --force
