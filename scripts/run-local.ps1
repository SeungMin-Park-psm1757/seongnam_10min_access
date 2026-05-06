param(
  [int]$Port = 3100
)

$ErrorActionPreference = "Stop"

$source = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$runDir = Join-Path $env:TEMP "seongnam_access_dashboard_run"

if (Test-Path -LiteralPath $runDir) {
  Remove-Item -LiteralPath $runDir -Recurse -Force
}

New-Item -ItemType Directory -Path $runDir | Out-Null

$files = @(
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  ".env.example",
  ".gitignore"
)

$dirs = @("src", "data", "docs", "scripts", "public", "artifacts")

foreach ($file in $files) {
  $from = Join-Path $source $file
  if (Test-Path -LiteralPath $from) {
    Copy-Item -LiteralPath $from -Destination $runDir
  }
}

foreach ($dir in $dirs) {
  $from = Join-Path $source $dir
  if (Test-Path -LiteralPath $from) {
    Copy-Item -LiteralPath $from -Destination $runDir -Recurse
  }
}

Push-Location $runDir
try {
  npm install --no-audit --no-fund
  npm run build
  npm run start -- -p $Port
} finally {
  Pop-Location
}
