param (
    [Parameter(Mandatory=$false, Position=0)]
    [string]$TargetId,
    [Parameter(Mandatory=$false)]
    [string]$Out,
    [switch]$List
)

$RootDir = (Resolve-Path "$PSScriptRoot\..").Path
$BrainDir = "$env:USERPROFILE\.gemini\antigravity-ide\brain"

if (-not (Test-Path $BrainDir)) {
    Write-Error "找不到 Antigravity IDE 資料目錄: $BrainDir"
    exit 1
}

$conversations = Get-ChildItem -Path $BrainDir -Directory | Where-Object { -not $_.Name.StartsWith(".") } | ForEach-Object {
    $log = "$($_.FullName)\.system_generated\logs\transcript_full.jsonl"
    if (Test-Path $log) {
        $item = Get-Item $log
        [PSCustomObject]@{
            Id = $_.Name
            LogPath = $log
            Size = $item.Length
            MTime = $item.LastWriteTime
        }
    }
} | Sort-Object MTime -Descending

if ($List) {
    Write-Host "`n找到 $($conversations.Count) 筆對話記錄 (依最新時間排序):"
    $idx = 1
    foreach ($c in ($conversations | Select-Object -First 10)) {
        $kb = [math]::Round($c.Size / 1KB, 1)
        Write-Host "  $idx. [$($c.MTime)] $($c.Id) ($kb KB)"
        $idx++
    }
    Write-Host "`n使用 .\scripts\export-conversation.ps1 <對話ID> 可匯出特定對話。"
    exit 0
}

$selected = $null
if ($TargetId) {
    $selected = $conversations | Where-Object { $_.Id -like "$TargetId*" } | Select-Object -First 1
    if (-not $selected) {
        Write-Error "找不到符合的對話 ID: $TargetId"
        exit 1
    }
} else {
    $selected = $conversations | Select-Object -First 1
}

if (-not $selected) {
    Write-Error "找不到任何可匯出的對話記錄。"
    exit 1
}

Write-Host "[export-chat] 目標對話 ID: $($selected.Id)"
$sizeKb = [math]::Round($selected.Size / 1KB, 1)
Write-Host "[export-chat] 來源記錄檔: $($selected.LogPath) ($sizeKb KB)"

$nodeScript = "$PSScriptRoot\export-conversation.mjs"
if ($Out) {
    node $nodeScript $selected.Id --out $Out
} else {
    node $nodeScript $selected.Id
}
