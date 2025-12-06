#!/bin/bash

# BountyChain Deployment Script
# This script deploys the Move contracts to Sui testnet

set -e

echo "🚀 BountyChain Deployment Script"
echo "================================"
echo ""

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Error: Sui CLI not found. Please install it first."
    echo "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

# Check active address
echo "📍 Checking active Sui address..."
ACTIVE_ADDRESS=$(sui client active-address 2>/dev/null || echo "")

if [ -z "$ACTIVE_ADDRESS" ]; then
    echo "❌ Error: No active Sui address found."
    echo "Run: sui client"
    exit 1
fi

echo "✅ Active address: $ACTIVE_ADDRESS"
echo ""

# Check balance
echo "💰 Checking SUI balance..."
BALANCE=$(sui client gas 2>/dev/null | grep "Total coins" | awk '{print $3}' || echo "0")
echo "Balance: $BALANCE SUI"

if [ "$BALANCE" == "0" ]; then
    echo "⚠️  Warning: Low balance. You may need testnet SUI."
    echo "Get testnet SUI from: https://discord.gg/sui"
    echo ""
fi

# Navigate to move directory
cd "$(dirname "$0")/../move"

echo "🔨 Building Move contracts..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to testnet
echo "📦 Publishing to Sui testnet..."
echo "This may take a few moments..."
echo ""

PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Publish failed!"
    echo "$PUBLISH_OUTPUT"
    exit 1
fi

# Parse output
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
REGISTRY_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("BountyRegistry")) | .objectId')
LEADERBOARD_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Leaderboard")) | .objectId')
MINI_HACK_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("MiniHackRegistry")) | .objectId')

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Contract Details:"
echo "==================="
echo "Package ID:       $PACKAGE_ID"
echo "Registry ID:      $REGISTRY_ID"
echo "Leaderboard ID:   $LEADERBOARD_ID"
echo "MiniHack ID:      $MINI_HACK_ID"
echo ""

# Update .env file
cd ..
ENV_FILE=".env"

echo "📝 Updating $ENV_FILE..."

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup"
fi

# Update or create .env
cat > "$ENV_FILE" << EOF
# Sui Network Configuration
VITE_SUI_NETWORK=testnet

# BountyChain Package ID
VITE_PACKAGE_ID=$PACKAGE_ID

# Walrus Network
VITE_WALRUS_NETWORK=testnet

# Sui Objects
VITE_BOUNTY_REGISTRY_ID=$REGISTRY_ID
VITE_LEADERBOARD_ID=$LEADERBOARD_ID
VITE_MINI_HACK_REGISTRY_ID=$MINI_HACK_ID
EOF

echo "✅ .env file updated!"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📌 Next steps:"
echo "1. Run: npm run dev"
echo "2. Connect your wallet"
echo "3. Create your first bounty!"
echo ""
echo "🔗 View on Sui Explorer:"
echo "https://testnet.suivision.xyz/package/$PACKAGE_ID"
echo ""
