use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

use crate::state::Config;

/// Instruction context for initializing a new AMM (Automated Market Maker) pool
#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Init<'info> {
    /// The user initializing the AMM pool, will pay for account creation
    #[account(mut)]
    pub init_user: Signer<'info>,
    
    /// The mint account for the first token (X) in the pool
    pub mint_token_x: Account<'info, Mint>,
    
    /// The mint account for the second token (Y) in the pool
    pub mint_token_y: Account<'info, Mint>,
    
    /// The LP (Liquidity Provider) token mint account
    /// This will be used to mint tokens to users who provide liquidity
    #[account(
        init,
        payer = init_user,
        seeds = [b"lp", config.key.as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = config,
    )]
    pub mint_lp_token: Account<'info, Mint>,
    
    /// Vault account that will hold token X deposits
    #[account(
        init,
        payer = init_user,
        associated_token::mint = mint_token_x,
        associated_token::authority = config,
    )]
    pub vault_token_x: Account<'info, TokenAccount>,
    
    /// Vault account that will hold token Y deposits
    #[account(
        init,
        payer = init_user,
        associated_token::mint = mint_token_y,
        associated_token::authority = config,
    )]
    pub vault_token_y: Account<'info, TokenAccount>,
    
    /// Configuration account that stores pool parameters and state
    #[account(
        init,
        payer = init_user,
        seeds = [b"config", seed.to_le_bytes().as_ref()],
        bump,
        space = Config::INIT_SPACE,
    )]
    pub config: Account<'info, Config>,
    
    /// Required program accounts
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Init<'info> {
    /// Initialize a new AMM pool with the given parameters
    /// * `seed` - Unique identifier for this pool
    /// * `fee` - Trading fee in basis points (1 bp = 0.01%)
    /// * `authority` - Optional authority that can control the pool
    /// * `bumps` - PDA bump seeds for config and LP token accounts
    pub fn init(&mut self, seed: u64, fee: u16, authority: Option<Pubkey>, bumps: InitBumps) -> Result<()> {
        self.config.set_inner(Config {
            seed,
            authority,
            mint_x: self.mint_token_x.key(),
            mint_y: self.mint_token_y.key(),
            fee,
            locked: false,
            config_bump: bumps.config,
            lp_bump: bumps.mint_lp_token,
        });

        Ok(())
    }
}