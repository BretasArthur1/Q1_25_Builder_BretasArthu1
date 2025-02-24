# Payment Engine

A decentralized payment engine built on the Solana blockchain that enables secure payment processing using USDC.

## About the Project

This project implements a decentralized payment system on Solana, featuring:
- Secure payment processing in USDC
- Escrow account creation to ensure transaction security
- Modern web interface for smart contract interaction

## Deployed Contract

The smart contract is deployed on Solana Devnet at the following address:
```
AeaX15Xn4YCSLGBvf1EMdjHViewi28odizgfyQ3RLD9e
```

## Technologies Used

- Solana Blockchain
- Anchor Framework
- TypeScript
- Next.js
- Web3.js
- SPL Token Program

## Frontend Application

The frontend application is built with Next.js and provides a user interface for interacting with the payment engine.

### Running Locally

1. Navigate to the frontend directory:
   ```bash
   cd app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Frontend Features
- Modern UI built with Next.js
- Wallet integration for Solana transactions
- Real-time payment processing interface
- Responsive design for all devices

## Smart Contract Testing

### Prerequisites

- Solana Tool Suite
- Anchor Framework
- Node.js and npm/yarn
- Unix-like environment (MacOS, Linux, or WSL for Windows)

### Cluster Configuration

Before running tests, ensure your `Anchor.toml` is configured for localnet:

```toml
[provider]
cluster = "localnet"
wallet = "/Users/your-user/.config/solana/id.json"
```

### Setup Steps

1. Navigate to the project root directory:
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

### Running Tests

After setup is complete, run the tests with:
```bash
anchor test --skip-local-validator
```

### Test Structure

The test suite includes two main test cases:
1. Creating escrow and processing payment successfully
2. Verifying failure when using an incorrect USDC mint

### Troubleshooting

If you encounter any issues:

1. **Validator Issues**
   ```bash
   pkill -f solana-test-validator
   ```
   Then run the setup script again

2. **Token Balance Issues**
   - The setup script mints 1000 USDC tokens
   - Check your balance with:
     ```bash
     spl-token accounts
     ```

3. **Cluster Configuration Issues**
   - Verify the local validator is running: `solana validators`
   - Check your `Anchor.toml` settings

## Environment Variables

The project uses the following environment variables:
- `ANCHOR_WALLET`: Points to your Solana keypair
- `ANCHOR_PROVIDER_URL`: Set to `http://127.0.0.1:8899` for local testing
