<#
.SYNOPSIS
    將指定目錄中的 Shapefile ZIP 壓縮檔批次轉換為 GeoJSON (.json) 格式。

.DESCRIPTION
    此腳本為 shp2geojson 的 PowerShell 輔助腳本。
    接收一個目錄路徑作為必要參數，將該目錄下的 *.zip 檔案轉換為 .json 格式。

.PARAMETER TargetDir
    必要參數。包含 Shapefile ZIP 壓縮檔的目錄或檔案路徑。

.EXAMPLE
    .\convert.ps1 D:\G\2304.W07003
    .\convert.ps1 -TargetDir "D:\G\2304.W07003" --prettify
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0, HelpMessage = "請提供目錄或檔案路徑")]
    [ValidateNotNullOrEmpty()]
    [string]$TargetDir,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs
)

# 移除結尾的斜線或反斜線
$normalizedTarget = $TargetDir.TrimEnd('\', '/')

if (-not (Test-Path -Path $normalizedTarget)) {
    Write-Error "[錯誤] 找不到指定的目錄或路徑: '$TargetDir'"
    exit 1
}

$resolvedPath = (Resolve-Path -Path $normalizedTarget).ProviderPath
$scriptPath = Join-Path $PSScriptRoot "bin" "shp2geojson"

if (Test-Path -Path $resolvedPath -PathType Container) {
    $inputPattern = Join-Path $resolvedPath "*.zip"
} else {
    $inputPattern = $resolvedPath
}

& node $scriptPath $inputPattern --json @ExtraArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
