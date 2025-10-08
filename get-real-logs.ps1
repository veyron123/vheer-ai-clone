# Get real logs from Render services
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"

Write-Host "Getting real service IDs and their logs..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

# Get services list
try {
    $servicesResponse = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30
    $services = $servicesResponse.Content | ConvertFrom-Json

    Write-Host "Found $($services.Count) services" -ForegroundColor Green
    Write-Host ""

    foreach ($service in $services) {
        if ($service.id) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "Service ID: $($service.id)" -ForegroundColor Yellow
            Write-Host "Name: $($service.name)" -ForegroundColor White
            Write-Host "Type: $($service.type)" -ForegroundColor Cyan
            Write-Host "Status: $($service.status)" -ForegroundColor Green

            # Try to get logs for this service
            try {
                Write-Host "" -ForegroundColor DarkGray
                Write-Host "Fetching logs for $($service.id)..." -ForegroundColor Magenta

                $logsResponse = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$($service.id)/logs?limit=20" -Headers $headers -UseBasicParsing -TimeoutSec 30

                if ($logsResponse.StatusCode -eq 200 -and $logsResponse.Content.Length -gt 0) {
                    $logs = $logsResponse.Content | ConvertFrom-Json

                    if ($logs -and $logs.Count -gt 0) {
                        Write-Host "✅ Found $($logs.Count) log entries:" -ForegroundColor Green

                        foreach ($log in $logs | Select-Object -First 5) {
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

                        if ($logs.Count -gt 5) {
                            Write-Host "... and $($logs.Count - 5) more log entries" -ForegroundColor Gray
                        }
                    } else {
                        Write-Host "⚠️  No logs found for this service" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "⚠️  No logs available for this service" -ForegroundColor Yellow
                }

            } catch {
                Write-Host "⚠️  Could not fetch logs: $($_.Exception.Message)" -ForegroundColor Yellow
            }

            Write-Host "" -ForegroundColor DarkGray
        }
    }

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

} catch {
    Write-Host "❌ Error getting services: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done! Check the logs above for your Render services." -ForegroundColor Cyan
