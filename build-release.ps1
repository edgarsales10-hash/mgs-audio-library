param(
  [string]$OutputPath = ".\\module.zip"
)

$ErrorActionPreference = "Stop"

$items = @(
  "module.json",
  "README.md",
  "LICENSE",
  "scripts",
  "data"
)

if (Test-Path -LiteralPath $OutputPath) {
  Remove-Item -LiteralPath $OutputPath -Force
}

$staging = Join-Path $env:TEMP ("mgs-audio-library-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Path $staging | Out-Null

try {
  foreach ($item in $items) {
    if (Test-Path -LiteralPath $item) {
      Copy-Item -LiteralPath $item -Destination $staging -Recurse -Force
    }
  }

  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OutputPath -CompressionLevel Optimal
  Write-Host "Release criada em $OutputPath"
}
finally {
  if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
  }
}
