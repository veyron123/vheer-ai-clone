Write-Host "Освобождаем порты 5000 и 5178..." -ForegroundColor Yellow

# Находим и закрываем процесс на порту 5000
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port5000) {
    $processId = $port5000.OwningProcess
    Write-Host "Закрываем процесс $processId на порту 5000" -ForegroundColor Cyan
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "Порт 5000 свободен" -ForegroundColor Green
}

# Находим и закрываем процесс на порту 5178
$port5178 = Get-NetTCPConnection -LocalPort 5178 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port5178) {
    $processId = $port5178.OwningProcess
    Write-Host "Закрываем процесс $processId на порту 5178" -ForegroundColor Cyan
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "Порт 5178 свободен" -ForegroundColor Green
}

Write-Host "Порты освобождены!" -ForegroundColor Green