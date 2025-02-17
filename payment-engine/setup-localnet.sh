#!/bin/bash
set -e

# =====================================================
# Cleanup: Kill any existing validator and remove old data
# =====================================================
echo "Cleaning up previous validator and build artifacts..."
pkill -f solana-test-validator || true
rm -rf test-ledger/
rm -rf .anchor/
anchor clean

# =====================================================
# Set Solana config to localhost
# =====================================================
echo "Configuring Solana to use localhost..."
solana config set --url http://127.0.0.1:8899

# =====================================================
# Create a new keypair and set it as default
# =====================================================
echo "Setting up keypair..."
solana-keygen new --outfile ~/.config/solana/id.json --force
solana config set --keypair ~/.config/solana/id.json

# Display wallet info
echo "Wallet address:"
solana address

# =====================================================
# Start the local validator in the background (if not already running)
# =====================================================
if ! pgrep -f solana-test-validator > /dev/null; then
  echo "Starting solana-test-validator..."
  solana-test-validator --reset --quiet &
  # Wait for the validator to initialize
  sleep 5
else
  echo "solana-test-validator is already running."
fi

# =====================================================
# Create USDC mint with 9 decimals using the SPL Token program
# =====================================================
echo "Creating USDC mint..."
# Capture the mint address from the output (adjust grep/awk if necessary)
USDC_MINT=$(spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA | grep "Creating token" | awk '{print $3}')
if [ -z "$USDC_MINT" ]; then
  echo "Failed to retrieve USDC mint address."
  exit 1
fi
echo "USDC Mint address: $USDC_MINT"

# =====================================================
# Create USDC account for the wallet
# =====================================================
echo "Creating USDC account..."
USDC_ACCOUNT=$(spl-token create-account $USDC_MINT | grep "Creating account" | awk '{print $3}')
if [ -z "$USDC_ACCOUNT" ]; then
  echo "Failed to retrieve USDC account address."
  exit 1
fi
echo "USDC Account address: $USDC_ACCOUNT"

# =====================================================
# Mint initial USDC tokens (1000 with 9 decimals)
# =====================================================
echo "Minting USDC tokens..."
# 1,000 * 10^9 = 1000000000000 base units
spl-token mint $USDC_MINT 1000000000000

# =====================================================
# Build the Anchor program
# =====================================================
echo "Building Anchor program..."
anchor build

# =====================================================
# Display final information
# =====================================================
echo "=== Setup Complete ==="
echo "USDC Mint: $USDC_MINT"
echo "USDC Account: $USDC_ACCOUNT"
echo "Wallet Address: $(solana address)"
echo "Balance: $(solana balance)"
echo "Token Accounts:"
spl-token accounts --owner $(solana address)

echo ""
echo "To run tests, use:"
echo "anchor test --skip-local-validator"
echo ""
echo "To update the USDC mint address in your program:"
echo "1. Copy the USDC_MINT address above"
echo "2. Update it in programs/payment-engine/src/constants.rs"
