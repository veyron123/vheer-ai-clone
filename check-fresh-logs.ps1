# Check fresh logs for WayForPay webhook
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"
$serviceId = "srv-d2fin2juibrs73a1ff8g"

Write-Host "Checking fresh logs for WayForPay webhook..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=50" -Headers $headers -UseBasicParsing -TimeoutSec 30

Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green

if ($response.Content.Length -gt 2) {
    $logs = $response.Content | ConvertFrom-Json
    Write-Host "Found $($logs.Count) log entries" -ForegroundColor Green
    Write-Host ""

    # Filter for WayForPay related logs
    $wayforpayLogs = $logs | Where-Object { $_.message -like "*WayForPay*" -or $_.message -like "*webhook*" -or $_.message -like "*payment*" -or $_.message -like "*callback*" -or $_.message -like "*DEBUG*" -or $_.message -like "*signature*" }

    if ($wayforpayLogs.Count -gt 0) {
        Write-Host "🎯 WayForPay related logs:" -ForegroundColor Yellow
        Write-Host "=========================" -ForegroundColor Yellow

        foreach ($log in $wayforpayLogs | Select-Object -First 20) {
            Write-Host "[$($log.timestamp)] $($log.message)"
        }
    } else {
        Write-Host "❌ No WayForPay related logs found in the last 50 entries" -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 Last 10 logs:" -ForegroundColor Yellow
        foreach ($log in $logs | Select-Object -First 10) {
            Write-Host "[$($log.timestamp)] $($log.message)"
        }
    }
} else {
    Write-Host "No logs content received" -ForegroundColor Yellow
}
}
