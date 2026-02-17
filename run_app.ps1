$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$BackendDir = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\backend"
$FrontendDir = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\frontend\cropshield_app"

Write-Host "Starting Backend..."
Start-Process node -ArgumentList "server.js" -WorkingDirectory $BackendDir -NoNewWindow -RedirectStandardOutput "$BackendDir\server_stdout.log" -RedirectStandardError "$BackendDir\server_stderr.log"

Write-Host "Waiting for backend to initialize (5s)..."
Start-Sleep -Seconds 5

Write-Host "Starting Flutter App on R58RB1S87GK..."
Start-Process flutter -ArgumentList "run", "-d", "R58RB1S87GK" -WorkingDirectory $FrontendDir -NoNewWindow -RedirectStandardOutput "$FrontendDir\flutter_stdout.log" -RedirectStandardError "$FrontendDir\flutter_stderr.log"

Write-Host "Processes started. Check log files for details."
