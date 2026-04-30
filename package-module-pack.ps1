param(
  [Parameter(Mandatory = $true)]
  [string]$WorldPackPath,

  [string]$DestinationPath = ".\\packs\\mgs-audio"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $WorldPackPath)) {
  throw "Compendio de origem nao encontrado: $WorldPackPath"
}

$sourceFiles = Get-ChildItem -LiteralPath $WorldPackPath -Force
if (-not $sourceFiles) {
  throw "A pasta do compendio existe, mas esta vazia: $WorldPackPath"
}

if (Test-Path -LiteralPath $DestinationPath) {
  Remove-Item -LiteralPath $DestinationPath -Recurse -Force
}

New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null

Get-ChildItem -LiteralPath $WorldPackPath -Force |
  Where-Object { $_.Name -ne "LOCK" } |
  ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $DestinationPath -Recurse -Force
}

Write-Host "Compendio copiado para $DestinationPath"
