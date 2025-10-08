# Basic Render API Test
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

    foreach ($service in $services) {
        Write-Host "ID: $($service.id)"
        Write-Host "Name: $($service.name)"
        Write-Host "Type: $($service.type)"
        Write-Host "Status: $($service.status)"
        Write-Host "---"
    }
} else {
    Write-Host "❌ API request failed" -ForegroundColor Red
}
