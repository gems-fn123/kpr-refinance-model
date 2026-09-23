$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js LTS belum tersedia."
}

npm install --global @microsoft/power-apps-cli
npm install --global @microsoft/power-apps
npm install

if (-not (Test-Path "power.config.json")) {
  Write-Host "Inisialisasi Power Apps Code App..."
  pa app init --display-name "KPR Refinance Calculator"
}

npm run build
pa app push
