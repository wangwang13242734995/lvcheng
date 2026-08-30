$subdomain = "lvcheng2026"
$port = 8080
$urlFile = "$PSScriptRoot\current-url.txt"

Write-Output "=== Tunnel Guard (serveo.net) ==="
Write-Output "Preferred URL: https://$subdomain.serveo.net"
Write-Output "Local port: $port"
Write-Output "==============================="

while ($true) {
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Output "[$ts] Starting SSH tunnel to serveo.net..."

    $proc = Start-Process -FilePath "ssh" `
        -ArgumentList @(
            "-o", "StrictHostKeyChecking=no",
            "-o", "ServerAliveInterval=30",
            "-o", "ServerAliveCountMax=3",
            "-R", "$subdomain`:80:localhost:$port",
            "serveo.net"
        ) `
        -NoNewWindow -PassThru

    # 等待 15 秒让隧道初始化，输出 URL 到 file
    Start-Sleep -Seconds 15

    if (!$proc.HasExited) {
        # URL 可能是固定的，也可能 serveo.net 给了备用
        "https://$subdomain.serveo.net" | Out-File -FilePath $urlFile -Encoding ascii
        Write-Output "[$ts] Tunnel UP: https://$subdomain.serveo.net (URL saved to urlFile)"
        # 等待进程退出
        $proc.WaitForExit()
    }

    $ts = Get-Date -Format "HH:mm:ss"
    Write-Output "[$ts] Tunnel DOWN (exit $($proc.ExitCode)), restarting in 5s..."
    Start-Sleep -Seconds 5
}
