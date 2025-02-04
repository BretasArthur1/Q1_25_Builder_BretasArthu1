use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Transfer, transfer, Mint, Token, TokenAccount, MintTo, mint_to}};
use constant_product_curve::ConstantProduct;

use crate::{errors::AmmError, state::Config};

/// Instruction context for depositing liquidity into the AMM pool
#[derive(Accounts)]
pub struct Deposit<'info> {
    /// The user depositing liquidity
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// Mint account for token X
    pub mint_x: Account<'info, Mint>,
    
    /// Mint account for token Y
    pub mint_y: Account<'info, Mint>,
    
    /// Pool configuration account
    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    
    /// LP token mint account
    #[account(
        mut,
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
    )]
    pub mint_lp: Account<'info, Mint>,
    
    /// Pool's vault for token X
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    
    /// Pool's vault for token Y
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    
    /// User's token X account
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    
    /// User's token Y account
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,
    
    /// User's LP token account (will be initialized if it doesn't exist)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_lp,
        associated_token::authority = user,
    )]
    pub user_lp: Account<'info, TokenAccount>,
    
    /// Required program accounts
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Deposit<'info> {
    /// Process a deposit of tokens into the AMM pool
    /// * `amount` - Amount of LP tokens the user wants to receive
    /// * `max_x` - Maximum amount of token X user is willing to deposit
    /// * `max_y` - Maximum amount of token Y user is willing to deposit
    pub fn deposit (
        &mut self,
        amount: u64,
        max_x: u64,
        max_y: u64,
    ) -> Result<()> {
        // Check if pool is not locked
        require!(self.config.locked == false, AmmError::PoolLocked);
        require!(amount != 0, AmmError::InvalidAmount);

        // Calculate deposit amounts based on pool state
        let (x, y) = match self.mint_lp.supply == 0 && self.vault_x.amount == 0 && self.vault_y.amount == 0 {
            // For first deposit, use maximum amounts directly
            true => (max_x, max_y),
            // For subsequent deposits, calculate based on pool ratio
            false => {
                let amounts = ConstantProduct::xy_deposit_amounts_from_l(
                    self.vault_x.amount, 
                    self.vault_y.amount, 
                    self.mint_lp.supply, 
                    amount, 
                    6
                ).unwrap();
                (amounts.x, amounts.y)
            }
        };

        // Verify amounts are within user's specified limits
        require!(x <= max_x && y <= max_y, AmmError::SlippageExceeded);

        // Execute the deposits and LP token minting
        self.deposit_tokens(true, x)?;  // deposit token X
        self.deposit_tokens(false, y)?; // deposit token Y
        self.mint_lp_tokens(amount)     // mint LP tokens to user
    }

    /// Helper function to transfer tokens from user to pool vault
    pub fn deposit_tokens(&self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (self.user_x.to_account_info(), self.vault_x.to_account_info()),
            false => (self.user_y.to_account_info(), self.vault_y.to_account_info()),
        };

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.user.to_account_info(),
        };
        let ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(ctx, amount)
    }

    /// Helper function to mint LP tokens to the user
    pub fn mint_lp_tokens(&self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: self.mint_lp.to_account_info(),
            to: self.user_lp.to_account_info(),
            authority: self.config.to_account_info(),
        };

        // Create signer seeds for the config PDA
        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        mint_to(ctx, amount)
    }
}