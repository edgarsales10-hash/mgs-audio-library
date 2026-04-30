param(
  [Parameter(Mandatory = $true)]
  [string]$SourceRoot,

  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [string]$OutputPath = ".\\data\\audio-index.json"
)

$ErrorActionPreference = "Stop"

function Convert-ToWebPath {
  param([string]$PathPart)

  $normalized = $PathPart -replace "\\", "/"
  $segments = $normalized.Split("/") | Where-Object { $_ -ne "" }
  return ($segments | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
}

$rootItem = Get-Item -LiteralPath $SourceRoot
if (-not $rootItem.PSIsContainer) {
  throw "SourceRoot precisa ser uma pasta."
}

$normalizedBase = $BaseUrl.TrimEnd("/")

$allowedExtensions = @(".ogg", ".mp3", ".wav", ".flac", ".webm", ".m4a")
$files = Get-ChildItem -LiteralPath $SourceRoot -Recurse -File |
  Where-Object { $allowedExtensions -contains $_.Extension.ToLowerInvariant() }

$entries = foreach ($file in $files) {
  $relativePath = $file.FullName.Substring($rootItem.FullName.Length).TrimStart("\")
  $webPath = Convert-ToWebPath -PathPart $relativePath
  $category = (($relativePath -split "[\\/]")[0])
  [pscustomobject]@{
    name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    file = $file.Name
    extension = $file.Extension.ToLowerInvariant()
    category = $category
    relativePath = $relativePath -replace "\\", "/"
    url = "$normalizedBase/$webPath"
  }
}

$grouped = $entries | Group-Object category | Sort-Object Name
$catalog = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  sourceRoot = $rootItem.FullName
  baseUrl = $normalizedBase
  total = @($entries).Count
  categories = @(
    foreach ($group in $grouped) {
      [pscustomobject]@{
        name = $group.Name
        total = @($group.Group).Count
        tracks = @($group.Group | Sort-Object relativePath)
      }
    }
  )
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$catalog | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Catalogo salvo em $OutputPath com $(@($entries).Count) arquivos."
