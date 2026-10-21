@echo off
setlocal
cd /d "%~dp0.."
if exist ".local\node-v24.20.0-win-x64\node.exe" (
  ".local\node-v24.20.0-win-x64\node.exe" node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort %*
) else (
  node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort %*
)
