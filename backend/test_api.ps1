$baseUrl = "http://localhost:5000/api"

function Test-Endpoint {
    param($method, $uri, $body, $desc)
    Write-Host "Testing $desc..." -NoNewline
    try {
        $params = @{
            Method = $method
            Uri = "$baseUrl$uri"
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
        
        $response = Invoke-RestMethod @params
        Write-Host " [SUCCESS]" -ForegroundColor Green
        return $response
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host $_.Exception.Response.GetResponseStream()
        Write-Host $_.Exception.Message
        return $null
    }
}

# 1. Login
$farmerLogin = Test-Endpoint -method POST -uri "/auth/login" -body @{email="farmer@test.com"; password="password123"} -desc "Farmer Login"
if ($farmerLogin.success) {
    Write-Host "Token received: $($farmerLogin.token.Substring(0, 10))..."
    
    # 2. Get Profile
    $headers = @{Authorization = "Bearer $($farmerLogin.token)"}
    Invoke-RestMethod -Method GET -Uri "$baseUrl/auth/profile" -Headers $headers | Out-Null
    Write-Host "Profile Fetch [SUCCESS]" -ForegroundColor Green

    # 3. Get Detections (Empty initially)
    Invoke-RestMethod -Method GET -Uri "$baseUrl/detections" -Headers $headers | Out-Null
    Write-Host "Detections Fetch [SUCCESS]" -ForegroundColor Green
}
