# Get raw response from Render API to understand data structure
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"

Write-Host "Getting raw API response..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

$response = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30

Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
Write-Host ""
Write-Host "Raw Response Content:" -ForegroundColor Yellow
Write-Host $response.Content -ForegroundColor White

if ($response.Content -and $response.Content.Length -gt 0) {
    Write-Host ""
    Write-Host "Formatted JSON:" -ForegroundColor Yellow
    try {
        $json = $response.Content | ConvertFrom-Json
        Write-Host ($json | ConvertTo-Json -Depth 5) -ForegroundColor White
    } catch {
        Write-Host "Failed to parse as JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
}
