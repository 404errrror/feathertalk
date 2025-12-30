@echo off
setlocal enabledelayedexpansion

set "PORT=8000"
set "HOST=http://localhost:%PORT%/index.html"

REM Prefer py launcher; fallback to python if available.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "!HOST!"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "!HOST!"
  python -m http.server %PORT%
  goto :eof
)

echo Python not found. Please install Python or add it to PATH.
echo https://www.python.org/downloads/
pause
endlocal
