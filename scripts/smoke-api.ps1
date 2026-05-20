$ErrorActionPreference = 'Stop'
$jar = Join-Path $PSScriptRoot 'smoke-cookies.txt'
if (Test-Path $jar) { Remove-Item $jar }

$base = 'http://localhost:3001'
$loginBodyPath = Join-Path $PSScriptRoot 'login-body.json'
'{"email":"admin@crm.local","password":"demo1234"}' | Set-Content -Path $loginBodyPath -NoNewline -Encoding ascii

Write-Host 'POST /api/auth/login'
$login = curl.exe -s -c $jar -b $jar -X POST "$base/api/auth/login" -H 'Content-Type: application/json' --data-binary "@$loginBodyPath"
Write-Host $login
if ($login -notmatch '"user"') { throw "Login failed: $login" }

Write-Host 'GET /api/v1/bootstrap'
$bootCode = curl.exe -s -c $jar -b $jar -o (Join-Path $PSScriptRoot 'bootstrap.json') -w '%{http_code}' "$base/api/v1/bootstrap"
Write-Host "HTTP $bootCode"
if ($bootCode -ne '200') { throw "Bootstrap failed with HTTP $bootCode" }
$boot = Get-Content (Join-Path $PSScriptRoot 'bootstrap.json') -Raw | ConvertFrom-Json
Write-Host "  users=$($boot.users.Count) deals=$($boot.deals.Count) integrations=$($boot.integrations.Count) inbox=$($boot.inboxMessages.Count)"

Write-Host 'GET /api/v1/search?q=test'
$search = curl.exe -s -c $jar -b $jar "$base/api/v1/search?q=test"
Write-Host $search

Write-Host 'GET /api/v1/integrations'
$int = curl.exe -s -c $jar -b $jar "$base/api/v1/integrations"
$intJ = $int | ConvertFrom-Json
Write-Host "  items=$($intJ.items.Count)"

Write-Host 'PATCH /api/auth/profile'
$profileBodyPath = Join-Path $PSScriptRoot 'profile-body.json'
'{"name":"Admin"}' | Set-Content -Path $profileBodyPath -NoNewline -Encoding ascii
$profile = curl.exe -s -c $jar -b $jar -X PATCH "$base/api/auth/profile" -H 'Content-Type: application/json' --data-binary "@$profileBodyPath"
Write-Host $profile

Write-Host 'OK — smoke tests passed'
