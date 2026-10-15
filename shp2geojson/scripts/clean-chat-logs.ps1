param (
    [switch]$Delete,
    [switch]$Clean,
    [string]$Dir
)

$RootDir = (Resolve-Path "$PSScriptRoot\..").Path
$NodeScript = "$PSScriptRoot\clean-chat-logs.mjs"

$cmdArgs = @()
if ($Delete -or $Clean) {
    $cmdArgs += "--delete"
}
if ($Dir) {
    $cmdArgs += "--dir"
    $cmdArgs += $Dir
}

node $NodeScript @cmdArgs
