#!/bin/bash

# Medis dApp Deployment Script for Sui
# This script deploys the medical records smart contract to Sui blockchain

echo "🏥 Medis dApp Smart Contract Deployment"
echo "======================================"

# Check if Sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Please install Sui CLI first."
    echo "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "contracts/Move.toml" ]; then
    echo "❌ Move.toml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Sui CLI found"
echo "📁 Project structure verified"

# Get current directory
PROJECT_ROOT=$(pwd)
CONTRACTS_DIR="$PROJECT_ROOT/contracts"

echo "📂 Moving to contracts directory..."
cd "$CONTRACTS_DIR"

# Set network (default to devnet)
NETWORK=${1:-devnet}
echo "🌐 Target network: $NETWORK"

# Build the contract
echo "🔨 Building Move contract..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check your Move code."
    exit 1
fi

echo "✅ Build successful"

# Deploy the contract
echo "🚀 Deploying contract to $NETWORK..."
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "✅ Deployment successful!"
echo "📜 Deployment output:"
echo "$DEPLOY_OUTPUT"

# Extract package ID, object IDs (this would need to be customized based on actual output)
echo ""
echo "🔍 Extracting important information..."
echo "📋 Please copy the following information to your .env.local file:"
echo ""
echo "# Copy these values from the deployment output above:"
echo "NEXT_PUBLIC_PACKAGE_ID=<PACKAGE_ID_FROM_OUTPUT>"
echo "NEXT_PUBLIC_HOSPITAL_REGISTRY_ID=<HOSPITAL_REGISTRY_OBJECT_ID>"
echo "NEXT_PUBLIC_RECORD_REGISTRY_ID=<RECORD_REGISTRY_OBJECT_ID>"
echo "NEXT_PUBLIC_ADMIN_CAP_ID=<ADMIN_CAP_OBJECT_ID>"
echo ""

# Return to project root
cd "$PROJECT_ROOT"

echo "🎉 Deployment process completed!"
echo ""
echo "📖 Next steps:"
echo "1. Copy the object IDs from the deployment output to .env.local"
echo "2. Update the environment variables in your Next.js app"
echo "3. Restart your development server: npm run dev"
echo "4. Test the application with the deployed contracts"
echo ""
echo "⚠️  Important: Save the deployment output for future reference!"