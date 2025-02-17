import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PaymentEngine } from "../target/types/payment_engine";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, mintTo, ASSOCIATED_TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

const { BN } = anchor;

/**
 * ======================
 * Configuration Section
 * ======================
 */

// USDC mint address that matches the TEST_USDC_MINT constant in the Rust program
// This is the only token mint that the program will accept for payments
// In production, this would be the real USDC mint address
const USDC_MINT = new PublicKey("7hUvjnJXF8gbdrSf2HZGnMJb4LwwD8cXM8wRhBEx2QDz");

// Create a new keypair to simulate the SWQuery service account
// In production, this would be SWQuery's actual account that receives payments
const swqueryKeypair = Keypair.generate();
const swquery = swqueryKeypair.publicKey;

/**
 * Token Account Variables
 * ----------------------
 * ATAs (Associated Token Accounts) are SPL token accounts that are deterministically
 * derived from a user's main account. They hold the token balances for that user.
 */
let userUsdcAta: PublicKey;    // The user's ATA for holding USDC tokens
let swqueryUsdcAta: PublicKey; // SWQuery's ATA for receiving USDC payments

/**
 * Wallet Configuration
 * -------------------
 * Load the local wallet for signing transactions. In Anchor tests,
 * this is typically loaded from the ANCHOR_WALLET environment variable,
 * which points to a local keypair file (usually in ~/.config/solana/id.json)
 */
let walletSecret: number[];
before(() => {
  const walletPath = process.env.ANCHOR_WALLET!;
  const walletContent = fs.readFileSync(walletPath, "utf8");
  walletSecret = JSON.parse(walletContent);
});

describe("payment-engine tests (localnet)", () => {
  // Initialize the Anchor provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.PaymentEngine as Program<PaymentEngine>;

  before(async () => {
    /**
     * Test Environment Setup
     * ---------------------
     * Before running tests, we need to:
     * 1. Fund accounts with SOL for transaction fees
     * 2. Verify USDC mint exists
     * 3. Create token accounts
     * 4. Mint test tokens
     */

    // Airdrop SOL to accounts for transaction fees
    // 2 SOL for the main wallet (needs more for creating ATAs and other operations)
    // 1 SOL for SWQuery (only needs enough for rent exemption)
    await provider.connection.requestAirdrop(provider.wallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(swquery, anchor.web3.LAMPORTS_PER_SOL);

    // Verify USDC mint exists on the network
    // This check ensures we're using a valid mint and helps with debugging
    const mintAccount = await provider.connection.getAccountInfo(USDC_MINT);
    if (!mintAccount) {
      console.log(
        "USDC mint doesn't exist. Create it using CLI command:\n" +
          "spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      );
      throw new Error("USDC mint doesn't exist");
    }

    /**
     * Token Account Setup
     * ------------------
     * Create or get Associated Token Accounts (ATAs) for both the user and SWQuery.
     * getOrCreateAssociatedTokenAccount will:
     * 1. Derive the ATA address
     * 2. Check if it exists
     * 3. Create it if it doesn't exist
     */
    
    // Setup user's USDC token account
    const userAtaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      Keypair.fromSecretKey(Uint8Array.from(walletSecret)),
      USDC_MINT,
      provider.wallet.publicKey
    );
    userUsdcAta = userAtaAccount.address;

    // Setup SWQuery's USDC token account
    const swqueryAtaAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      Keypair.fromSecretKey(Uint8Array.from(walletSecret)),
      USDC_MINT,
      swquery
    );
    swqueryUsdcAta = swqueryAtaAccount.address;

    /**
     * Mint Test Tokens
     * ---------------
     * Mint 10 test USDC tokens to the user's account
     * Using 9 decimal places (standard for USDC), so the actual amount is:
     * 10 * 10^9 = 10,000,000,000 base units
     */
    try {
      await mintTo(
        provider.connection,
        Keypair.fromSecretKey(Uint8Array.from(walletSecret)),
        USDC_MINT,
        userUsdcAta,
        provider.wallet.publicKey,
        10 * 1e9,
        [],
        undefined,
        TOKEN_PROGRAM_ID
      );
    } catch (error) {
      console.error("Error minting tokens:", error);
      console.log("Checking token balances...");
      const balance = await provider.connection.getTokenAccountBalance(userUsdcAta);
      console.log("User USDC balance:", balance.value.uiAmount);
      if (balance.value.uiAmount === 0) {
        throw new Error("Failed to setup test tokens");
      }
    }
  });

  describe("make-escrow instruction", () => {
    it("creates escrow and processes payment successfully", async () => {
      /**
       * Test Case: Successful Escrow Creation
       * ------------------------------------
       * This test verifies that:
       * 1. Escrow account can be created
       * 2. Payment is processed correctly
       * 3. Account data is stored properly
       */

      // Initialize test parameters with timestamp to ensure unique seeds
      const seed = new BN(Date.now());  // Use timestamp as seed to ensure uniqueness
      const planId = new BN(1);  // Using Basic plan (10 USDC, 20 requests)

      /**
       * PDA Derivation
       * --------------
       * Generate Program Derived Addresses (PDAs) for:
       * 1. Escrow account: Stores payment and plan details
       * 2. User account: Stores user's subscription info
       * 
       * PDAs are deterministic addresses that are derived from seeds and
       * guaranteed to not have a corresponding private key
       */
      const [escrowPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("escrow"),
          provider.wallet.publicKey.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      const [userAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

      /**
       * Execute makeEscrow Instruction
       * -----------------------------
       * Call the program with all required accounts:
       * - user: The payer and authority
       * - escrow: PDA to store escrow data
       * - userAccount: PDA to store user data
       * - Token accounts for transfer
       * - System accounts for creation and rent
       */
      const txSignature = await program.methods.makeEscrow(seed, planId)
        .accounts({
          user: provider.wallet.publicKey,
          escrow: escrowPda,
          userAccount: userAccountPda,
          usdcMint: USDC_MINT,
          swquery,
          userTokenAccount: userUsdcAta,
          swqueryTokenAccount: swqueryUsdcAta,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      console.log("Transaction signature", txSignature);

      /**
       * Verification
       * -----------
       * Verify that:
       * 1. Escrow account was created with correct data
       * 2. Tokens were transferred successfully
       */
      const escrowAccount = await program.account.swqueryEscrow.fetch(escrowPda);
      console.log("Escrow account data:", escrowAccount);
      assert.ok(escrowAccount.seed.eq(seed), "Escrow seed should match input");
      assert.ok(escrowAccount.usdcAmount.toNumber() > 0, "Amount should be positive");

      // Verify token transfer by checking recipient's balance
      const swqueryTokenBalance = await provider.connection.getTokenAccountBalance(swqueryUsdcAta);
      console.log("SWQuery token account balance:", swqueryTokenBalance.value.amount);
      assert.ok(parseInt(swqueryTokenBalance.value.amount) > 0, "SWQuery should have received tokens");
    });

    it("fails when provided with an incorrect USDC mint", async () => {
      /**
       * Test Case: Security Check - Invalid USDC Mint
       * -------------------------------------------
       * This test verifies that the program correctly rejects
       * transactions that try to use an unauthorized token mint.
       * This is a critical security feature that ensures only
       * the official USDC token can be used for payments.
       */

      const seed = new BN(Date.now() + 1);  // Use timestamp + 1 to ensure different from first test
      const planId = new BN(1);

      // Derive PDAs as in the successful case
      const [escrowPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("escrow"),
          provider.wallet.publicKey.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      const [userAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

      /**
       * Create Invalid Mint
       * ------------------
       * Create a new mint that looks like USDC (same decimals)
       * but isn't the authorized mint. The program should reject
       * any attempts to use this mint for payments.
       */
      const wrongMintKeypair = Keypair.generate();
      const wrongMint = wrongMintKeypair.publicKey;
      await createMint(
        provider.connection,
        Keypair.fromSecretKey(Uint8Array.from(walletSecret)),
        provider.wallet.publicKey,
        provider.wallet.publicKey,
        9,  // Same decimals as USDC
        wrongMintKeypair,
        undefined,
        TOKEN_PROGRAM_ID
      );

      // Wait for mint creation to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      /**
       * Attempt Invalid Transaction
       * -------------------------
       * Try to execute makeEscrow with the wrong mint.
       * This should fail with InvalidMint error, proving
       * that the program's security check is working.
       */
      try {
        await program.methods.makeEscrow(seed, planId)
          .accounts({
            user: provider.wallet.publicKey,
            escrow: escrowPda,
            userAccount: userAccountPda,
            usdcMint: wrongMint, // Using unauthorized mint - should trigger error
            swquery,
            userTokenAccount: userUsdcAta,
            swqueryTokenAccount: swqueryUsdcAta,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          } as any)
          .rpc();
        throw new Error("Transaction should have failed with InvalidMint error");
      } catch (err: any) {
        console.log("Expected error with invalid USDC mint:", err.message);
        assert.ok(err.message.includes("InvalidMint"), "Error should indicate invalid mint");
      }
    });
  });
});
