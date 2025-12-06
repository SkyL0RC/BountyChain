#!/bin/bash

echo "🧪 BountyChain Contract Test Script"
echo "===================================="
echo ""

# Load environment variables
source .env

echo "📋 Checking Environment Variables..."
echo "-----------------------------------"
echo "Package ID: $VITE_PACKAGE_ID"
echo "Bounty Registry: $VITE_BOUNTY_REGISTRY_ID"
echo "Leaderboard: $VITE_LEADERBOARD_ID"
echo "Mini Hack Registry: $VITE_MINI_HACK_REGISTRY_ID"
echo "Network: $VITE_SUI_NETWORK"
echo ""

if [ "$VITE_PACKAGE_ID" = "YOUR_PACKAGE_ID_HERE" ]; then
    echo "❌ Error: .env not configured! Run deployment first."
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

echo "🔍 Testing Sui Objects..."
echo "------------------------"

# Test 1: Check if objects exist
echo "1. Checking Bounty Registry..."
sui client object $VITE_BOUNTY_REGISTRY_ID --json > /tmp/registry.json 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Bounty Registry exists"
    REGISTRY_TYPE=$(cat /tmp/registry.json | jq -r '.data.type' 2>/dev/null)
    echo "   Type: $REGISTRY_TYPE"
else
    echo "   ❌ Bounty Registry not found!"
fi
echo ""

echo "2. Checking Leaderboard..."
sui client object $VITE_LEADERBOARD_ID --json > /tmp/leaderboard.json 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Leaderboard exists"
    LEADERBOARD_TYPE=$(cat /tmp/leaderboard.json | jq -r '.data.type' 2>/dev/null)
    echo "   Type: $LEADERBOARD_TYPE"
else
    echo "   ❌ Leaderboard not found!"
fi
echo ""

echo "3. Checking Mini Hack Registry..."
sui client object $VITE_MINI_HACK_REGISTRY_ID --json > /tmp/minihack.json 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Mini Hack Registry exists"
    MINIHACK_TYPE=$(cat /tmp/minihack.json | jq -r '.data.type' 2>/dev/null)
    echo "   Type: $MINIHACK_TYPE"
else
    echo "   ❌ Mini Hack Registry not found!"
fi
echo ""

echo "4. Checking Package..."
sui client object $VITE_PACKAGE_ID --json > /tmp/package.json 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Package exists"
else
    echo "   ❌ Package not found!"
fi
echo ""

echo "🌐 Testing Walrus Endpoint..."
echo "----------------------------"
WALRUS_PUBLISHER="https://publisher.walrus-testnet.walrus.space"
WALRUS_AGGREGATOR="https://aggregator.walrus-testnet.walrus.space"

echo "1. Publisher endpoint..."
curl -s -o /dev/null -w "%{http_code}" $WALRUS_PUBLISHER > /tmp/walrus_pub_status.txt
PUB_STATUS=$(cat /tmp/walrus_pub_status.txt)
if [ "$PUB_STATUS" = "200" ] || [ "$PUB_STATUS" = "405" ]; then
    echo "   ✅ Publisher reachable (Status: $PUB_STATUS)"
else
    echo "   ⚠️  Publisher status: $PUB_STATUS"
fi
echo ""

echo "2. Aggregator endpoint..."
curl -s -o /dev/null -w "%{http_code}" $WALRUS_AGGREGATOR > /tmp/walrus_agg_status.txt
AGG_STATUS=$(cat /tmp/walrus_agg_status.txt)
if [ "$AGG_STATUS" = "200" ] || [ "$AGG_STATUS" = "404" ]; then
    echo "   ✅ Aggregator reachable (Status: $AGG_STATUS)"
else
    echo "   ⚠️  Aggregator status: $AGG_STATUS"
fi
echo ""

echo "📊 Summary"
echo "=========="
echo "✅ Contract test completed!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5174 in browser"
echo "2. Open browser console (F12)"
echo "3. Connect your Sui wallet"
echo "4. Check console for any errors"
echo "5. Try creating a test bounty"
echo ""
echo "🔍 Watch for:"
echo "   - Console errors (red text)"
echo "   - Network failures in Network tab"
echo "   - Transaction signature prompts"
echo "   - Success notifications"
echo ""
