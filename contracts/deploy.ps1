# Deploy script for Medis dApp smart contracts
# Run this from the contracts directory

# Build the project
Write-Host "Building smart contracts..." -ForegroundColor Green
sui move build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Now publishing..." -ForegroundColor Green
    
    # Publish the package
    Write-Host "Publishing to testnet..." -ForegroundColor Yellow
    $publishResult = sui client publish --gas-budget 100000000 --json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully published!" -ForegroundColor Green
        Write-Host "Parse the output above to get the package ID and object IDs" -ForegroundColor Yellow
        Write-Host $publishResult
    } else {
        Write-Host "Failed to publish. Error details above." -ForegroundColor Red
    }
} else {
    Write-Host "Build failed. Please fix the errors above." -ForegroundColor Red
}