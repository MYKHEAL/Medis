# Medis dApp Smart Contract Deployment Script for Windows
# PowerShell version of the deployment script

Write-Host "🏥 Medis dApp Smart Contract Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if Sui CLI is installed
try {
    $suiVersion = sui --version
    Write-Host "✅ Sui CLI found: $suiVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Sui CLI not found. Please install Sui CLI first." -ForegroundColor Red
    Write-Host "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "contracts\Move.toml")) {
    Write-Host "❌ Move.toml not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📁 Project structure verified" -ForegroundColor Green

# Get current directory and set paths
$ProjectRoot = Get-Location
$ContractsDir = Join-Path $ProjectRoot "contracts"

Write-Host "📂 Moving to contracts directory..." -ForegroundColor Yellow
Set-Location $ContractsDir

# Set network (default to devnet)
$Network = if ($args[0]) { $args[0] } else { "devnet" }
Write-Host "🌐 Target network: $Network" -ForegroundColor Cyan

# Build the contract
Write-Host "🔨 Building Move contract..." -ForegroundColor Yellow
$buildResult = & sui move build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check your Move code." -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy the contract
Write-Host "🚀 Deploying contract to $Network..." -ForegroundColor Yellow
$deployOutput = & sui client publish --gas-budget 100000000 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed." -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "📜 Deployment output:" -ForegroundColor Cyan
Write-Host $deployOutput

# Extract information
Write-Host ""
Write-Host "🔍 Extracting important information..." -ForegroundColor Yellow
Write-Host "📋 Please copy the following information to your .env.local file:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Copy these values from the deployment output above:" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_PACKAGE_ID=<PACKAGE_ID_FROM_OUTPUT>" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_HOSPITAL_REGISTRY_ID=<HOSPITAL_REGISTRY_OBJECT_ID>" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_RECORD_REGISTRY_ID=<RECORD_REGISTRY_OBJECT_ID>" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_ADMIN_CAP_ID=<ADMIN_CAP_OBJECT_ID>" -ForegroundColor Yellow
Write-Host ""

# Return to project root
Set-Location $ProjectRoot

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the object IDs from the deployment output to .env.local" -ForegroundColor White
Write-Host "2. Update the environment variables in your Next.js app" -ForegroundColor White
Write-Host "3. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "4. Test the application with the deployed contracts" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Save the deployment output for future reference!" -ForegroundColor Yellow