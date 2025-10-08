# Debug Render API logs response
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"
$serviceId = "srv-example1"

Write-Host "Debugging Render API logs response..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

try {
    Write-Host "Making API request to: https://api.render.com/v1/services/$serviceId/logs?limit=10" -ForegroundColor Gray

    $response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$serviceId/logs?limit=10" -Headers $headers -UseBasicParsing -TimeoutSec 30

    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content Length: $($response.Content.Length)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Raw Response Content:" -ForegroundColor Yellow
    Write-Host $response.Content -ForegroundColor White

    if ($response.Content -and $response.Content.Length -gt 0) {
        try {
            $logs = $response.Content | ConvertFrom-Json
            Write-Host ""
            Write-Host "Parsed JSON:" -ForegroundColor Yellow
            Write-Host ($logs | ConvertTo-Json -Depth 3) -ForegroundColor White
        } catch {
            Write-Host ""
            Write-Host "Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response Content: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
}
