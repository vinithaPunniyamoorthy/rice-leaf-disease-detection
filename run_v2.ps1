$env:JAVA_HOME = "C:\Users\vinit\.jdks\openjdk-24.0.2"
$BackendDir = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\backend"
$FrontendDir = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app"

$LogDir = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\logs"
If (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir }

$BackendLog = "$LogDir\backend.log"
$FrontendLog = "$LogDir\frontend.log"

Write-Host "Starting Backend..."
Start-Process node -ArgumentList "server.js" -WorkingDirectory $BackendDir -NoNewWindow -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendLog

Write-Host "Starting Frontend (Flutter run)..."
Start-Process flutter -ArgumentList "run", "-d", "R58RB1S87GK" -WorkingDirectory $FrontendDir -NoNewWindow -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendLog

Write-Host "Processes started. Logs are in $LogDir"
