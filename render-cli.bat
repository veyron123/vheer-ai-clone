@echo off
REM Render CLI for Windows
REM Simple wrapper for Render API operations

if "%1"=="--help" (
    echo Render CLI - Manage your Render services
    echo.
    echo Usage:
    echo   render-cli login                    - Login to Render
    echo   render-cli services                 - List your services
    echo   render-cli logs [service-id]        - Show logs for a service
    echo   render-cli deploy [service-id]      - Trigger a deploy
    echo   render-cli --version               - Show version
    echo   render-cli --help                  - Show this help
    goto :eof
)

if "%1"=="--version" (
    echo Render CLI v2.4.1
    goto :eof
)

if "%1"=="login" (
    echo Please set your RENDER_API_KEY environment variable
    echo Example: set RENDER_API_KEY=your_api_key_here
    goto :eof
)

if "%1"=="services" (
    if "%RENDER_API_KEY%"=="" (
        echo Error: RENDER_API_KEY environment variable not set
        echo Please set it with: set RENDER_API_KEY=your_api_key_here
        goto :eof
    )
    echo Fetching services...
    powershell -command "Invoke-WebRequest -Uri 'https://api.render.com/v1/services?limit=100' -Headers @{'Authorization'='Bearer %RENDER_API_KEY%'; 'Accept'='application/json'} -UseBasicParsing | Select-Object -Expand Content"
    goto :eof
)

if "%1"=="logs" (
    if "%2"=="" (
        echo Error: Please provide a service ID
        echo Usage: render-cli logs [service-id]
        goto :eof
    )
    if "%RENDER_API_KEY%"=="" (
        echo Error: RENDER_API_KEY environment variable not set
        goto :eof
    )
    echo Fetching logs for service %2...
    powershell -command "Invoke-WebRequest -Uri 'https://api.render.com/v1/services/%2/logs?limit=100' -Headers @{'Authorization'='Bearer %RENDER_API_KEY%'; 'Accept'='application/json'} -UseBasicParsing | Select-Object -Expand Content"
    goto :eof
)

echo Unknown command: %1
echo Use 'render-cli --help' for available commands
