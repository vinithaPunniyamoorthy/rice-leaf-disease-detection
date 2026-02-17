$OutputFile = "c:\Users\vinit\OneDrive\Desktop\Rice_disease\diag.txt"
"Starting Diag" | Out-File -FilePath $OutputFile -Encoding UTF8
"JAVA_HOME: $($env:JAVA_HOME)" | Out-File -FilePath $OutputFile -Append -Encoding UTF8
"CHECKING JAVA" | Out-File -FilePath $OutputFile -Append -Encoding UTF8
& java -version 2>&1 | Out-File -FilePath $OutputFile -Append -Encoding UTF8
"CHECKING FLUTTER" | Out-File -FilePath $OutputFile -Append -Encoding UTF8
& flutter --version 2>&1 | Out-File -FilePath $OutputFile -Append -Encoding UTF8
"FINISHED" | Out-File -FilePath $OutputFile -Append -Encoding UTF8
