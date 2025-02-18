#!/bin/bash
set -e

# =====================================================
# Set Solana config to devnet
# =====================================================
echo "Configuring Solana to use devnet..."
solana config set --url https://api.devnet.solana.com

# =====================================================
# Check wallet and balance
# =====================================================
echo "Checking wallet setup..."
WALLET_ADDRESS=$(solana address)
echo "Wallet address: $WALLET_ADDRESS"
echo "Current balance: $(solana balance)"

# =====================================================
# Create USDC mint with 9 decimals using the SPL Token program
# =====================================================
echo "Creating USDC mint..."
# Capture the mint address from the output
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
# Mint initial USDC tokens (10 with 9 decimals)
# =====================================================
echo "Minting USDC tokens..."
# 10 * 10^9 = 10000000000 base units
spl-token mint $USDC_MINT 10000000000

# =====================================================
# Build the Anchor program
# =====================================================
echo "Building Anchor program..."
anchor build

# =====================================================
# Deploy to devnet
# =====================================================
echo "Deploying to devnet..."
anchor deploy

# =====================================================
# Display final information
# =====================================================
echo "=== Setup Complete ==="
echo "USDC Mint: $USDC_MINT"
echo "USDC Account: $USDC_ACCOUNT"
echo "Wallet Address: $WALLET_ADDRESS"
echo "Balance: $(solana balance)"
echo "Token Accounts:"
spl-token accounts

echo ""
echo "To update the USDC mint address in your program:"
echo "1. Copy the USDC_MINT address above"
echo "2. Update it in programs/payment-engine/src/constants.rs"
echo "3. Run update-program.sh to update all necessary files" 