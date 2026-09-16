$ErrorActionPreference = 'Stop'

$repoPath = 'C:\Users\93500\OneDrive\Desktop\wealthpulse'
$logFile = Join-Path $repoPath 'auto-push.log'

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Out-File -Append $logFile
}

try {
    Set-Location $repoPath
    git pull --rebase origin main 2>$null
}
catch {
    Write-Log "Initial pull skipped or failed: $($_.Exception.Message)"
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName, [System.IO.NotifyFilters]::LastWrite, [System.IO.NotifyFilters]::CreationTime

$debounce = 5

$eventAction = {
    Start-Sleep -Seconds $debounce

    try {
        $localRepo = 'C:\Users\93500\OneDrive\Desktop\wealthpulse'
        Set-Location $localRepo

        git add .
        $status = git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Log 'No changes detected; skipping push.'
            return
        }

        git commit -m "Auto-sync update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push origin main
        Write-Log 'GitHub sync successful.'
    }
    catch {
        Write-Log "GitHub sync failed: $($_.Exception.Message)"
    }
}

Register-ObjectEvent -InputObject $watcher -EventName 'Changed' -Action $eventAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName 'Created' -Action $eventAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName 'Deleted' -Action $eventAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName 'Renamed' -Action $eventAction | Out-Null

Write-Host 'Watching for changes in:' $repoPath
Write-Host 'Press Ctrl+C to stop auto-sync.'

while ($true) {
    Start-Sleep -Seconds 10
}
