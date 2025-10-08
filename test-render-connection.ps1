# Test Render API Connection
$apiKey = "rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo"

Write-Host "Testing Render API connection..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Accept" = "application/json"
    }

    $response = Invoke-WebRequest -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers -UseBasicParsing -TimeoutSec 30

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Successfully connected to Render API!" -ForegroundColor Green

        $services = $response.Content | ConvertFrom-Json
        Write-Host ""
        Write-Host "Found $($services.Count) services:" -ForegroundColor Yellow

        foreach ($service in $services) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "Service ID: $($service.id)" -ForegroundColor Yellow
            Write-Host "Name: $($service.name)" -ForegroundColor White
            Write-Host "Type: $($service.type)" -ForegroundColor Cyan
            Write-Host "Status: $($service.status)" -ForegroundColor Green

            if ($service.serviceDetails -and $service.serviceDetails.url) {
                Write-Host "URL: $($service.serviceDetails.url)" -ForegroundColor Blue
            }

            if ($service.createdAt) {
                Write-Host "Created: $($service.createdAt)" -ForegroundColor Gray
            }

            if ($service.updatedAt) {
                Write-Host "Updated: $($service.updatedAt)" -ForegroundColor Gray
            }
        }

        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

        # Show available service IDs for log access
        Write-Host "Available Service IDs for log access:" -ForegroundColor Magenta
        foreach ($service in $services) {
            if ($service.id) {
                Write-Host "  - $($service.id)" -ForegroundColor Gray
            }
        }

    } else {
        Write-Host "❌ API request failed with status: $($response.StatusCode)" -ForegroundColor Red
    }

} catch {
        Write-Host "❌ Error connecting to Render API:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red

        if ($_.Exception.Response) {
            Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Write-Host "Response Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Use a service ID above with: .\render-cli.ps1 logs <service-id>" -ForegroundColor White
Write-Host "2. Or use MCP server: node render-mcp-server.js" -ForegroundColor White
