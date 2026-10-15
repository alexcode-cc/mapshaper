@echo off
setlocal
set "SCRIPT_DIR=%~dp0"

if "%~1"=="" (
    echo [ERROR] Missing required argument: Please provide directory path.
    echo Usage: %~nx0 ^<directory^> [options]
    echo Example: %~nx0 D:\G\2304.W07003
    exit /b 1
)

set "TARGET_DIR=%~1"

:strip_slash
if "%TARGET_DIR:~-1%x"=="\x" (
    set "TARGET_DIR=%TARGET_DIR:~0,-1%"
    goto strip_slash
)

if not exist "%TARGET_DIR%" (
    echo [ERROR] Directory or path not found: "%TARGET_DIR%"
    exit /b 1
)

shift /1
set "EXTRA_ARGS="
:collect_args
if "%~1"=="" goto run
set "EXTRA_ARGS=%EXTRA_ARGS% %1"
shift /1
goto collect_args

:run
if /i "%TARGET_DIR:~-4%"==".zip" (
    set "INPUT_PATTERN=%TARGET_DIR%"
) else (
    set "INPUT_PATTERN=%TARGET_DIR%\*.zip"
)

node "%SCRIPT_DIR%bin\shp2geojson" "%INPUT_PATTERN%" --json%EXTRA_ARGS%