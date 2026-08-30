$ProgressPreference = 'SilentlyContinue'
$logFile = "$PSScriptRoot\cf-tunnel.log"
$urlFile = "$PSScriptRoot\current-url.txt"

Remove-Item $logFile -ErrorAction SilentlyContinue

Write-Output "[$(Get-Date -Format 'HH:mm:ss')] Starting cloudflared via npx... (log -> $logFile)"

# 用 cmd /c 确保能正确捕获子进程的 stderr/stdout
$proc = Start-Process -FilePath "cmd" `
    -ArgumentList "/c", "cd /d `"$PSScriptRoot`" && npx --yes cloudflared tunnel --url http://localhost:8080 > $logFile 2>&1" `
    -NoNewWindow -PassThru

# 等待 45 秒，读取日志并提取 URL
for ($i = 0; $i -lt 18; $i++) {
    Start-Sleep -Seconds 3
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        Write-Output "[$($i*3)s] Log length: $($logContent.Length)"

        # 两种 URL 格式都匹配
        if ($logContent -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $url = $Matches[0]
            Write-Output "✅ TUNNEL URL FOUND: $url"
            $url | Out-File -FilePath $urlFile -Encoding ascii
            exit 0
        }
        if ($logContent -match 'ERROR|FATAL|fatal|error') {
            Write-Output "⚠️  Log (last 1500 chars):"
            Write-Output $logContent.Substring([Math]::Max(0, $logContent.Length-1500))
        }
    }
    if ($proc.HasExited) {
        Write-Output "❌ cloudflared 进程已退出 (exit: $($proc.ExitCode))"
        if (Test-Path $logFile) {
            Write-Output "=== LOG (last 2000 chars) ==="
            $log = Get-Content $logFile -Raw
            Write-Output $log.Substring([Math]::Max(0, $log.Length-2000))
        }
        exit 1
    }
}

Write-Output "❌ 超时未获取到 URL。Log (last 2000):"
if (Test-Path $logFile) { Get-Content $logFile -Tail 60 }
