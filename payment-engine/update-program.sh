#!/bin/bash
set -e

# =====================================================
# Use the existing USDC mint address
# =====================================================
echo "Using existing USDC mint address..."
LATEST_MINT="9ThGirbgEtRrjwtg1DVZ4fD5BkPAWtseYpgrsLH3NFu8"
echo "USDC mint address: $LATEST_MINT"

# =====================================================
# Update the mint address in the Rust program
# =====================================================
echo "Updating mint address in Rust program..."
CONSTANTS_FILE="programs/payment-engine/src/constants.rs"

# Create backup of the original file
cp "$CONSTANTS_FILE" "${CONSTANTS_FILE}.bak"

# Update the mint address in the Rust file
sed -i '' "s/pub const TEST_USDC_MINT: Pubkey = pubkey!(\"[^\"]*\")/pub const TEST_USDC_MINT: Pubkey = pubkey!(\"$LATEST_MINT\")/" "$CONSTANTS_FILE"

# =====================================================
# Build and deploy the program
# =====================================================
echo "Building and deploying program..."
anchor build
anchor deploy

# =====================================================
# Copy IDL and types to frontend
# =====================================================
echo "Updating frontend files..."
cp target/idl/payment_engine.json app/frontend/lib/idl/
cp target/types/payment_engine.ts app/frontend/lib/types/

# =====================================================
# Update mint address in frontend files
# =====================================================
echo "Updating mint address in frontend files..."
ANCHOR_CLIENT_FILE="app/frontend/lib/anchorClient.ts"
PRICING_PAGE_FILE="app/frontend/app/pricing/page.tsx"

# Create backups of the original files
cp "$ANCHOR_CLIENT_FILE" "${ANCHOR_CLIENT_FILE}.bak"
cp "$PRICING_PAGE_FILE" "${PRICING_PAGE_FILE}.bak"

# Update the mint address in frontend files
sed -i '' "s/const TEST_USDC_MINT = new PublicKey(\"[^\"]*\")/const TEST_USDC_MINT = new PublicKey(\"$LATEST_MINT\")/" "$ANCHOR_CLIENT_FILE"
sed -i '' "s/const TEST_USDC_MINT_KEY = new PublicKey(\"[^\"]*\")/const TEST_USDC_MINT_KEY = new PublicKey(\"$LATEST_MINT\")/" "$PRICING_PAGE_FILE"

echo "=== Update Complete ==="
echo "USDC Mint: $LATEST_MINT"
echo ""
echo "Files updated:"
echo "1. $CONSTANTS_FILE"
echo "2. $ANCHOR_CLIENT_FILE"
echo "3. $PRICING_PAGE_FILE"
echo "4. Frontend IDL and types"
echo ""
echo "Next steps:"
echo "1. Restart your frontend application"
echo "2. Test the updated functionality"
echo ""
echo "Backups of modified files were created with .bak extension" 