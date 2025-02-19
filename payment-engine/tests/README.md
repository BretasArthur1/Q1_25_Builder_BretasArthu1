# Running Payment Engine Tests

This document explains how to run the tests for the Payment Engine program.

## Prerequisites

- Solana Tool Suite
- Anchor Framework
- Node.js and npm/yarn
- A Unix-like environment (MacOS, Linux, or WSL for Windows)

## Important: Cluster Configuration

Before running tests, ensure your `Anchor.toml` is configured for localnet:

```toml
[provider]
cluster = "localnet"  # Change this if it's set to "devnet"
wallet = "/Users/your-user/.config/solana/id.json"
```

This configuration is crucial because:
- Tests should run on localnet for speed and reliability
- No SOL is consumed from devnet
- You have full control over the test environment
- State can be easily reset between test runs

## Setup Steps

1. First, ensure you're in the project root directory:
   ```bash
   cd payment-engine
   ```

2. Run the setup script to prepare the local environment:
   ```bash
   ./setup-localnet.sh
   ```
   This script will:
   - Clean up any existing validator
   - Configure Solana for localhost
   - Create a new keypair
   - Start a local validator
   - Create and configure the USDC test mint
   - Build the Anchor program

## Running the Tests

After the setup is complete, you can run the tests using:
```bash
anchor test --skip-local-validator
```

Note: We use `--skip-local-validator` because the setup script already started one.

## Test Structure

The test suite includes two main test cases:
1. Creating escrow and processing payment successfully
2. Verifying failure when using an incorrect USDC mint

## Troubleshooting

If you encounter any issues:

1. **Validator Issues**
   - Ensure no other validator is running:
     ```bash
     pkill -f solana-test-validator
     ```
   - Run the setup script again

2. **Token Balance Issues**
   - The setup script mints 1000 USDC tokens
   - Check your balance using:
     ```bash
     spl-token accounts
     ```

3. **USDC Mint Address Mismatch**
   - Ensure the USDC mint address in `tests/payment-engine.ts` matches the one in `programs/payment-engine/src/constants.rs`
   - The setup script will output the correct address to use

4. **Cluster Configuration Issues**
   - If tests fail with connection errors, verify your cluster setting in `Anchor.toml`
   - Ensure you're not accidentally connecting to devnet
   - Check that your local validator is running: `solana validators`

## Environment Variables

The test suite uses these environment variables:
- `ANCHOR_WALLET`: Points to your Solana keypair (usually `~/.config/solana/id.json`)
- `ANCHOR_PROVIDER_URL`: Set to `http://127.0.0.1:8899` for local testing 