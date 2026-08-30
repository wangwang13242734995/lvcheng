$port = 8080
$urlFile = "$PSScriptRoot\current-url.txt"
$logFile = "$PSScriptRoot\tunnel-guard.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8 -ErrorAction SilentlyContinue
}

Log "=== Tunnel Guard (localhost.run) Started ==="
Log "Local port: $port"
Log "URL file: $urlFile"

while ($true) {
    Log "Starting new SSH tunnel (localhost.run)..."

    # 启动 SSH，同时捕获 stdout 到临时文件
    $tmpOut = "$PSScriptRoot\ssh-temp.log"
    Remove-Item $tmpOut -ErrorAction SilentlyContinue

    $proc = Start-Process -FilePath "ssh" `
        -ArgumentList @(
            "-o", "StrictHostKeyChecking=no",
            "-o", "ServerAliveInterval=30",
            "-o", "ServerAliveCountMax=3",
            "-R", "80:localhost:$port",
            "nokey@localhost.run"
        ) `
        -RedirectStandardOutput $tmpOut `
        -NoNewWindow -PassThru

    # 等待 12 秒，然后读取临时文件提取 URL
    Start-Sleep -Seconds 12

    if (!$proc.HasExited -and (Test-Path $tmpOut)) {
        $content = Get-Content $tmpOut -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-zA-Z0-9]+\.lhr\.life") {
            $url = $Matches[0]
            $url | Out-File -FilePath $urlFile -Encoding ascii
            Log "TUNNEL UP: $url  (saved to current-url.txt)"
        } else {
            Log "Warning: Could not extract URL from output: $($content.Substring(0, [Math]::Min(300, $content.Length)))"
        }

        # 监控进程，最长存活 1 小时（localhost.run 一般能稳定 ~30 分钟）
        $timeout = [DateTime]::Now.AddMinutes(55)
        while (!$proc.HasExited -and [DateTime]::Now -lt $timeout) {
            Start-Sleep -Seconds 10
        }

        if ($proc.HasExited) {
            Log "TUNNEL DOWN (exit code: $($proc.ExitCode))"
        } else {
            Log "TUNNEL TIMEOUT REACHED, force restart"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    } else {
        if ($proc.HasExited) {
            $output = if (Test-Path $tmpOut) { Get-Content $tmpOut -Raw } else { "no output file" }
            Log "SSH exited too quickly (exit: $($proc.ExitCode)), output: $($output.Substring(0, [Math]::Min(300, $output.Length)))"
        }
    }

    Log "Waiting 5s before restart..."
    Start-Sleep -Seconds 5
}
