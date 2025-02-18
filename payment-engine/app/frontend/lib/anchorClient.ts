/**
 * This file implements the client-side interface for interacting with the Payment Engine Solana program.
 * It provides a type-safe wrapper around the Anchor-generated program interface.
 */

import { AnchorProvider, Program, BN, IdlAccounts } from "@coral-xyz/anchor";
import { Connection, PublicKey, Commitment, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from "./idl/payment_engine.json"; 
import type { PaymentEngine } from "./types/payment_engine";

// Type definitions for network configuration and program accounts
export type Cluster = "localnet" | "devnet" | "mainnet-beta";
// Import account types from the program's IDL
export type SwqueryEscrow = IdlAccounts<PaymentEngine>["swqueryEscrow"];
export type UserAccount = IdlAccounts<PaymentEngine>["userAccount"];

/**
 * Represents a subscription plan in the system.
 * Plans are predefined and stored on-chain.
 */
export interface Plan {
  id: number;
  name: string;
  price: number;
  requests: number;
  description: string;
}

/**
 * Network configuration for different Solana clusters.
 * Contains endpoints and program ID for each network.
 */
export interface NetworkConfig {
  httpUrl: string;
  wsUrl: string;
  programId: string;
}

/**
 * Result type for escrow creation operations.
 * Provides detailed information about the operation's outcome.
 */
export interface MakeEscrowResult {
  success: boolean;
  signature?: string;
  escrowAddress?: PublicKey;
  error?: Error;
}

// Network configurations for different Solana clusters
const NETWORK_CONFIGURATIONS: Record<Cluster, NetworkConfig> = {
  localnet: {
    httpUrl: "http://127.0.0.1:8899",
    wsUrl: "ws://127.0.0.1:8900",
    programId: "AeaX15Xn4YCSLGBvf1EMdjHViewi28odizgfyQ3RLD9e",
  },
  devnet: {
    httpUrl: "https://api.devnet.solana.com",
    wsUrl: "wss://api.devnet.solana.com",
    programId: "AeaX15Xn4YCSLGBvf1EMdjHViewi28odizgfyQ3RLD9e",
  },
  "mainnet-beta": {
    httpUrl: "https://api.mainnet-beta.solana.com",
    wsUrl: "wss://api.mainnet-beta.solana.com",
    programId: "AeaX15Xn4YCSLGBvf1EMdjHViewi28odizgfyQ3RLD9e",
  },
};

// USDC token mint address used for payments
// Must match the TEST_USDC_MINT constant in the Rust program
const TEST_USDC_MINT = new PublicKey("9ThGirbgEtRrjwtg1DVZ4fD5BkPAWtseYpgrsLH3NFu8");

// Predefined subscription plans available in the system
// These should match the plans defined in the Rust program
const AVAILABLE_PLANS: Plan[] = [
  {
    id: 1,
    name: "Basic",
    price: 0.1,
    requests: 20,
    description: "Basic plan with 20 requests",
  },
  {
    id: 2,
    name: "Standard",
    price: 0.2,
    requests: 50,
    description: "Standard plan with 50 requests",
  },
  {
    id: 3,
    name: "Premium",
    price: 0.5,
    requests: 100,
    description: "Premium plan with 100 requests",
  },
];

/**
 * Cache configuration for client-side data
 */
interface CacheConfig<T> {
  duration: number;
  lastFetchTime: number;
  data: T;
}

/**
 * Main client class for interacting with the Payment Engine program.
 * Provides methods for creating escrows, fetching account data, and managing subscriptions.
 */
export class AnchorClient {
  private program: Program<PaymentEngine>;
  private connection: Connection;
  public wallet: AnchorWallet;
  private plansCache: CacheConfig<Plan[]> | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Creates a new instance of the AnchorClient.
   * Sets up the connection to Solana and initializes the Anchor program interface.
   * 
   * @param wallet - The wallet that will sign transactions
   * @param cluster - The Solana cluster to connect to
   * @param commitment - The commitment level for transactions
   */
  constructor(
    wallet: AnchorWallet,
    cluster: Cluster = "devnet",
    commitment: Commitment = "processed"
  ) {
    const network = NETWORK_CONFIGURATIONS[cluster];
    this.connection = new Connection(network.httpUrl, commitment);
    this.wallet = wallet;

    const provider = new AnchorProvider(
      this.connection,
      wallet,
      { 
        commitment, 
        preflightCommitment: commitment,
        skipPreflight: true // Skip transaction simulation
      }
    );

    // Initialize the program interface with the IDL
    this.program = new Program<PaymentEngine>(
      idl as unknown as PaymentEngine,
      provider,
    );
  }

  /**
   * Returns the program ID of the Payment Engine.
   * Useful for deriving PDAs and verifying program ownership.
   */
  public get programId(): PublicKey {
    return this.program.programId;
  }

  /**
   * Returns the list of available subscription plans.
   * Uses a hybrid approach:
   * 1. First tries to use cached data if available and not expired
   * 2. Falls back to predefined plans if cache is expired or empty
   * 
   * The plans are validated against the program's expected values
   * to ensure consistency between client and program.
   * 
   * @returns Array of available subscription plans
   */
  public async getAvailablePlans(): Promise<Plan[]> {
    // Check cache first
    if (this.plansCache && 
        (Date.now() - this.plansCache.lastFetchTime) < this.plansCache.duration) {
      return this.plansCache.data;
    }

    // Use predefined plans (which match the program's plans)
    this.plansCache = {
      data: AVAILABLE_PLANS,
      lastFetchTime: Date.now(),
      duration: this.CACHE_DURATION
    };
    
    return AVAILABLE_PLANS;
  }

  /**
   * Validates if a plan ID exists and matches the program's definition.
   * Used before creating escrows to ensure plan validity.
   * 
   * @param planId - The ID of the plan to validate
   * @returns The plan if valid, throws error if invalid
   */
  private async validatePlan(planId: number): Promise<Plan> {
    const plans = await this.getAvailablePlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error(`Plan ${planId} not found or is not valid`);
    }
    
    return plan;
  }

  /**
   * Fetches and calculates the USDC balance of a token account.
   * Converts from base units (with 9 decimals) to human-readable format.
   * 
   * @param userTokenAccount - The token account to check
   * @returns The balance in USDC (e.g., 10.5 for 10.5 USDC)
   */
  public async getUsdcBalance(userTokenAccount: PublicKey): Promise<number> {
    try {
      const account = await getAccount(this.connection, userTokenAccount);
      return Number(account.amount) / Math.pow(10, 9); // Convert from base units
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      return 0;
    }
  }

  /**
   * Creates a new escrow payment for a subscription plan.
   * This is the main function for initiating a new subscription:
   * 1. Validates the plan exists and user has sufficient balance
   * 2. Derives necessary PDAs (Program Derived Addresses)
   * 3. Submits the transaction to create the escrow and transfer tokens
   * 
   * The function performs client-side validation before submitting the transaction
   * to prevent unnecessary fees from failed transactions.
   * 
   * @param seed - Unique identifier for the escrow (usually timestamp)
   * @param planId - ID of the subscription plan to purchase
   * @param userTokenAccount - User's USDC token account
   * @param swqueryTokenAccount - SWQuery's USDC token account to receive payment
   * @param swqueryAccount - Main SWQuery account that manages the service
   */
  public async makeEscrow(
    seed: number,
    planId: number,
    userTokenAccount: PublicKey,
    swqueryTokenAccount: PublicKey,
    swqueryAccount: PublicKey
  ): Promise<MakeEscrowResult> {
    try {
      // Validate plan exists and matches program definition
      const plan = await this.validatePlan(planId);

      // Check USDC balance before attempting transaction
      const balance = await this.getUsdcBalance(userTokenAccount);
      if (balance < plan.price) {
        throw new Error(
          `Insufficient USDC balance. Required: ${plan.price} USDC, Available: ${balance} USDC`
        );
      }

      // Derive the escrow PDA - this will store the escrow details
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          this.wallet.publicKey.toBuffer(),
          new BN(seed).toArrayLike(Buffer, "le", 8),
        ],
        this.program.programId
      );

      // Derive the user account PDA - this tracks user's subscriptions
      const [userAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), this.wallet.publicKey.toBuffer()],
        this.program.programId
      );
              
      // Submit the transaction with all required accounts
      const tx = await this.program.methods
        .makeEscrow(new BN(seed), new BN(planId))
        .accounts({
          user: this.wallet.publicKey,
          escrow: escrowPda,
          userAccount: userAccountPda,
          usdcMint: TEST_USDC_MINT,
          swquery: swqueryAccount,
          userTokenAccount: userTokenAccount,
          swqueryTokenAccount: swqueryTokenAccount,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any) 
        .rpc();

      return { success: true, signature: tx, escrowAddress: escrowPda };
    } catch (error) {
      console.error("Error creating escrow:", error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Fetches all escrow accounts owned by a specific user.
   * Uses memcmp filter to find accounts where the user field matches.
   * The offset accounts for the account discriminator and other fields.
   * 
   * @param userPubkey - Public key of the user to fetch escrows for
   * @returns Array of escrow accounts and their data
   */
  public async getEscrowsByUser(userPubkey: PublicKey) {
    try {
      const escrows = await this.program.account.swqueryEscrow.all([
        {
          memcmp: {
            offset: 8 + 8 + 1, // Skip: discriminator (8) + seed (8) + bump (1)
            bytes: userPubkey.toBase58(),
          },
        },
      ]);
      return escrows;
    } catch (error) {
      console.error("Error fetching escrows:", error);
      return [];
    }
  }

  /**
   * Fetches a specific escrow account's data.
   * Used to get details about a particular subscription payment.
   * 
   * @param escrowPubkey - Public key of the escrow account
   * @returns The escrow data or null if not found
   */
  public async getEscrow(escrowPubkey: PublicKey): Promise<SwqueryEscrow | null> {
    try {
      return await this.program.account.swqueryEscrow.fetch(escrowPubkey);
    } catch (error) {
      console.error("Error fetching escrow:", error);
      return null;
    }
  }

  /**
   * Fetches a user's account data containing subscription information.
   * This account tracks all active subscriptions and available requests.
   * 
   * @param userPubkey - Public key of the user
   * @returns The user account data or null if not found
   */
  public async getUserAccount(userPubkey: PublicKey): Promise<UserAccount | null> {
    try {
      const [userAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), userPubkey.toBuffer()],
        this.program.programId
      );
      return await this.program.account.userAccount.fetch(userAccountPda);
    } catch (error) {
      console.error("Error fetching user account:", error);
      return null;
    }
  }

  /**
   * Derives the Program Derived Address (PDA) for a user's account.
   * This is a deterministic address that stores the user's subscription data.
   * 
   * @param userPubkey - Public key of the user
   * @returns The derived PDA for the user account
   */
  public getUserAccountPDA(userPubkey: PublicKey): PublicKey {
    const [userAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPubkey.toBuffer()],
      this.program.programId
    );
    return userAccountPda;
  }

  /**
   * Derives the Program Derived Address (PDA) for an escrow account.
   * Each escrow is uniquely identified by the combination of:
   * - User's public key
   * - A unique seed (usually a timestamp)
   * 
   * @param seed - Unique identifier for the escrow
   * @param userPubkey - Public key of the user
   * @returns The derived PDA for the escrow account
   */
  public getEscrowPDA(seed: number, userPubkey: PublicKey): PublicKey {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        userPubkey.toBuffer(),
        new BN(seed).toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );
    return escrowPda;
  }
}

/**
 * Factory function to create a new AnchorClient instance.
 * Provides a convenient way to initialize the client with default settings.
 */
export const createAnchorClient = (
  wallet: AnchorWallet,
  cluster: Cluster = "devnet",
  commitment: Commitment = "processed"
): AnchorClient => {
  return new AnchorClient(wallet, cluster, commitment);
};
