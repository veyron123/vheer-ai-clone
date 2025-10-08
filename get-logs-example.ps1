# Example script to get logs from Render services
# This script demonstrates how to use the Render API to fetch logs

Write-Host "Render Logs Example Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Example service IDs (you would get these from the services list)
$serviceIds = @(
    "srv-example1",
    "srv-example2",
    "srv-example3",
    "srv-example4"
)

Write-Host ""
Write-Host "To get logs for a specific service, use:" -ForegroundColor Yellow
Write-Host ".\render-cli.ps1 logs srv-xxxxxxxxxxxxx" -ForegroundColor White
Write-Host ""
Write-Host "Or with PowerShell directly:" -ForegroundColor Yellow

foreach ($serviceId in $serviceIds) {
    Write-Host "powershell -command `""
    Write-Host "`$headers = @{"
    Write-Host "    'Authorization' = 'Bearer rnd_KqTTkfYphSxF9I2dmlr1Z9uidZdo'"
    Write-Host "    'Accept' = 'application/json'"
    Write-Host "}"
    Write-Host "`$response = Invoke-WebRequest -Uri 'https://api.render.com/v1/services/$serviceId/logs?limit=50' -Headers `$headers -UseBasicParsing"
    Write-Host "`$logs = `$response.Content | ConvertFrom-Json"
    Write-Host "foreach (`$log in `$logs) {"
    Write-Host "    Write-Host `"[`$(`$log.timestamp)] `$(`$log.message)`" -ForegroundColor Green"
    Write-Host "}"
    Write-Host '`"'
    Write-Host ""
}

Write-Host "Make sure to replace 'srv-example1' with actual service IDs from your Render dashboard." -ForegroundColor Magenta
