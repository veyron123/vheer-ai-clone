# Final simple test for Render API
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"
Write-Host "Testing Render API connection..."

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30
Write-Host "Status Code: $($response.StatusCode)"

if ($response.StatusCode -eq 200) {
    Write-Host "✅ Successfully connected to Render API!" -ForegroundColor Green
    $services = $response.Content | ConvertFrom-Json
    Write-Host "Found $($services.Count) services" -ForegroundColor Yellow

    $service = $services[0]
    Write-Host "First service ID: $($service.id)" -ForegroundColor Cyan

    # Try to get logs for the first service
    try {
        $logsResponse = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$($service.id)/logs?limit=10" -Headers $headers -UseBasicParsing -TimeoutSec 30
        Write-Host "Logs Status Code: $($logsResponse.StatusCode)" -ForegroundColor Green

        if ($logsResponse.Content.Length -gt 0) {
            $logs = $logsResponse.Content | ConvertFrom-Json
            Write-Host "Found $($logs.Count) log entries" -ForegroundColor Green

            foreach ($log in $logs) {
                Write-Host "[$($log.timestamp)] $($log.message)" -ForegroundColor White
            }
        } else {
            Write-Host "No logs content" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error getting logs: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ API request failed" -ForegroundColor Red
}
