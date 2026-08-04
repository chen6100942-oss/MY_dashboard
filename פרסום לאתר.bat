@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo Preparing the dashboard update...
git add index.html public src dist
git commit -m "feat: update dashboard experience and weekly planner"
echo.
echo Publishing to GitHub...
git push origin main
if errorlevel 1 (
  echo.
  echo GitHub may ask you to sign in. Complete the sign-in and run this file again.
  pause
  exit /b 1
)
echo.
echo Published successfully. Vercel will update the existing link shortly.
pause
