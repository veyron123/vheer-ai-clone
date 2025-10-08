# Render CLI for Windows PowerShell
# Simple wrapper for Render API operations

param(
    [string]$Command,
    [string]$ServiceId,
    [string]$ApiKey
)

function Show-Help {
    Write-Host "Render CLI - Manage your Render services" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\render-cli.ps1 login                    - Login to Render"
    Write-Host "  .\render-cli.ps1 services                 - List your services"
    Write-Host "  .\render-cli.ps1 logs [service-id]        - Show logs for a service"
    Write-Host "  .\render-cli.ps1 deploy [service-id]      - Trigger a deploy"
    Write-Host "  .\render-cli.ps1 --version               - Show version"
    Write-Host "  .\render-cli.ps1 --help                  - Show this help"
    Write-Host ""
}

function Get-Version {
    Write-Host "Render CLI v2.4.1" -ForegroundColor Cyan
}

function Login {
    Write-Host "Please set your RENDER_API_KEY environment variable" -ForegroundColor Yellow
    Write-Host "Example: `$env:RENDER_API_KEY = 'your_api_key_here'" -ForegroundColor Gray
    Write-Host "Or create a .env file with RENDER_API_KEY=your_key" -ForegroundColor Gray
}

function Get-Services {
    $apiKey = $env:RENDER_API_KEY
    if (-not $apiKey) {
        Write-Host "Error: RENDER_API_KEY environment variable not set" -ForegroundColor Red
        Write-Host "Please set it with: `$env:RENDER_API_KEY = 'your_api_key_here'" -ForegroundColor Yellow
        return
    }

    Write-Host "Fetching services..." -ForegroundColor Cyan

    try {
        $response = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" `
                                     -Headers @{
                                         "Authorization" = "Bearer $apiKey"
                                         "Accept" = "application/json"
                                     } `
                                     -UseBasicParsing

        $services = $response.Content | ConvertFrom-Json
        Write-Host "Found $($services.Length) services:" -ForegroundColor Green
        Write-Host ""

        foreach ($service in $services) {
            Write-Host "ID: $($service.id)" -ForegroundColor Yellow
            Write-Host "Name: $($service.name)" -ForegroundColor White
            Write-Host "Type: $($service.type)" -ForegroundColor Gray
            Write-Host "Status: $($service.status)" -ForegroundColor Cyan
            Write-Host "URL: $($service.serviceDetails.url)" -ForegroundColor Blue
            Write-Host "------------------------" -ForegroundColor DarkGray
        }
    }
    catch {
        Write-Host "Error fetching services: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-Logs {
    param([string]$serviceId)

    if (-not $serviceId) {
        Write-Host "Error: Please provide a service ID" -ForegroundColor Red
        Write-Host "Usage: .\render-cli.ps1 logs [service-id]" -ForegroundColor Yellow
        return
    }

    $apiKey = $env:RENDER_API_KEY
    if (-not $apiKey) {
        Write-Host "Error: RENDER_API_KEY environment variable not set" -ForegroundColor Red
        return
    }

    Write-Host "Fetching logs for service $serviceId..." -ForegroundColor Cyan

    try {
        $response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=100" `
                                     -Headers @{
                                         "Authorization" = "Bearer $apiKey"
                                         "Accept" = "application/json"
                                     } `
                                     -UseBasicParsing

        $logs = $response.Content | ConvertFrom-Json
        Write-Host "Recent logs:" -ForegroundColor Green
        Write-Host ""

        foreach ($log in $logs) {
            $timestamp = [DateTime]::Parse($log.timestamp).ToString("yyyy-MM-dd HH:mm:ss")
            Write-Host "[$timestamp] $($log.message)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "Error fetching logs: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main command processing
switch ($Command) {
    "--help" { Show-Help }
    "--version" { Get-Version }
    "login" { Login }
    "services" { Get-Services }
    "logs" { Get-Logs -serviceId $ServiceId }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
    }
}
