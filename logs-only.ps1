# Get logs for colibrrri-fullstack service
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"
$serviceId = "srv-d2fin2juibrs73a1ff8g"

Write-Host "Getting logs for colibrrri-fullstack service..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=50" -Headers $headers -UseBasicParsing -TimeoutSec 30

Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host "Content Length: $($response.Content.Length)" -ForegroundColor Green

if ($response.Content.Length -gt 2) {
    $logs = $response.Content | ConvertFrom-Json
    Write-Host "Found $($logs.Count) log entries" -ForegroundColor Green

    foreach ($log in $logs) {
        Write-Host "[$($log.timestamp)] $($log.message)"
    }
} else {
    Write-Host "No logs content received" -ForegroundColor Yellow
}
