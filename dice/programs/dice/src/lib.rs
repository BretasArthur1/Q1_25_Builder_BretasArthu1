use anchor_lang::prelude::*;


declare_id!("B9s1AvNPkbRLDSN8WCbtce33rsAdUsjbhB8LYqRz94a4");

mod state;
mod contexts;
mod error;

use contexts::*;

#[program]
pub mod dice {
    use super::*;

    /// Initialize the house vault with initial funds
    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        ctx.accounts.init(amount)
    }

    /// Place a new bet with specified parameters
    /// * `seed` - Random seed for the bet
    /// * `roll` - Number that player needs to roll under to win
    /// * `amount` - Amount of lamports being bet
    pub fn place_bet(ctx: Context<PlaceBet>, seed: u128, roll: u8, amount: u64) -> Result<()> {
        ctx.accounts.create_bet(seed, amount, roll, &ctx.bumps)?;
        ctx.accounts.deposit(amount)
    }

    /// Resolve a bet using house signature
    /// * `sig` - Ed25519 signature from house to verify the bet outcome
    pub fn resolve_bet(ctx: Context<ResolveBet>, sig: Vec<u8>) -> Result<()> {
        ctx.accounts.verify_ed25519_signature(&sig)?;
        ctx.accounts.resolve_bet(&sig, &ctx.bumps)
    }

    /// Refund a bet that wasn't resolved within the time limit
    pub fn refund_bet(ctx: Context<RefundBet>) -> Result<()> {
        ctx.accounts.refund_bet(&ctx.bumps)
    }
}


