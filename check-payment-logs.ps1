# Check for recent payment/webhook logs
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"
$serviceId = "srv-d2fin2juibrs73a1ff8g"

Write-Host "Checking for recent payment/webhook logs..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30

Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green

if ($response.Content.Length -gt 2) {
    $logs = $response.Content | ConvertFrom-Json
    Write-Host "Found $($logs.Count) log entries" -ForegroundColor Green
    Write-Host ""

    # Look for payment related logs
    $paymentLogs = @()
    foreach ($log in $logs) {
        $message = $log.message
        if ($message -like "*WayForPay*" -or
            $message -like "*webhook*" -or
            $message -like "*payment*" -or
            $message -like "*callback*" -or
            $message -like "*DEBUG*" -or
            $message -like "*signature*" -or
            $message -like "*SUCCESS*" -or
            $message -like "*CART*" -or
            $message -like "*subscription*" -or
            $message -like "*credit*" -or
            $message -like "*order*") {
            $paymentLogs += $log
        }
    }

    if ($paymentLogs.Count -gt 0) {
        Write-Host "🎯 Payment related logs:" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow

        foreach ($log in $paymentLogs | Select-Object -First 25) {
            Write-Host "[$($log.timestamp)] $($log.message)"
        }
    } else {
        Write-Host "❌ No payment related logs found in the last 100 entries" -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 Last 10 logs:" -ForegroundColor Yellow
        foreach ($log in $logs | Select-Object -First 10) {
            Write-Host "[$($log.timestamp)] $($log.message)"
        }
    }
} else {
    Write-Host "No logs content received" -ForegroundColor Yellow
}
