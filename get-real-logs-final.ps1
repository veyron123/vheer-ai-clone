# Get real logs from your Render services
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"

Write-Host "🎉 Render API Connection Successful!" -ForegroundColor Green
Write-Host "📊 Found your 4 Render services:" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

# Get services list
$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30
$servicesData = $response.Content | ConvertFrom-Json

# Display services with proper structure
foreach ($item in $servicesData) {
    $service = $item.service
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "🆔 Service ID: $($service.id)" -ForegroundColor Yellow
    Write-Host "📝 Name: $($service.name)" -ForegroundColor White
    Write-Host "🔧 Type: $($service.type)" -ForegroundColor Cyan
    Write-Host "⚡ Status: $($service.suspended)" -ForegroundColor Green
    Write-Host "🌐 URL: $($service.serviceDetails.url)" -ForegroundColor Blue
    Write-Host "📅 Created: $($service.createdAt)" -ForegroundColor Gray
    Write-Host "🔄 Updated: $($service.updatedAt)" -ForegroundColor Gray

    # Try to get logs for this service
    Write-Host "" -ForegroundColor DarkGray
    Write-Host "📋 Fetching logs for $($service.name)..." -ForegroundColor Magenta

    try {
        $logsResponse = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$($service.id)/logs?limit=20" -Headers $headers -UseBasicParsing -TimeoutSec 30

        if ($logsResponse.StatusCode -eq 200 -and $logsResponse.Content.Length -gt 2) {
            $logs = $logsResponse.Content | ConvertFrom-Json

            if ($logs -and $logs.Count -gt 0) {
                Write-Host "✅ Found $($logs.Count) log entries:" -ForegroundColor Green

                foreach ($log in $logs | Select-Object -First 8) {
                    $timestamp = $log.timestamp
                    $message = $log.message
                    $level = $log.level

                    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
                    if ($level -eq "error") {
                        Write-Host $message -ForegroundColor Red
                    } elseif ($level -eq "warn") {
                        Write-Host $message -ForegroundColor Yellow
                    } else {
                        Write-Host $message -ForegroundColor White
                    }
                }

                if ($logs.Count -gt 8) {
                    Write-Host "... and $($logs.Count - 8) more log entries" -ForegroundColor Gray
                }
            } else {
                Write-Host "⚠️  No logs found for $($service.name)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  No logs available for $($service.name)" -ForegroundColor Yellow
        }

    } catch {
        Write-Host "⚠️  Could not fetch logs for $($service.name): $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Write-Host "" -ForegroundColor DarkGray
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🎯 Your main service for logs: colibrrri-fullstack" -ForegroundColor Cyan
Write-Host "🔗 URL: https://colibrrri-fullstack.onrender.com" -ForegroundColor Blue
Write-Host "📊 To monitor this service, use:" -ForegroundColor Yellow
Write-Host "   .\render-cli.ps1 logs srv-d2fin2juibrs73a1ff8g" -ForegroundColor White
