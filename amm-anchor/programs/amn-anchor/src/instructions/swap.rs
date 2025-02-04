use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount, Transfer, transfer}};
use constant_product_curve::{ConstantProduct, LiquidityPair};

use crate::{errors::AmmError, state::Config};

/// Accounts structure for the swap instruction
#[derive(Accounts)]
pub struct Swap<'info> {
    /// The user performing the swap
    #[account(mut)]
    pub user: Signer<'info>,
    /// Token mint for the X token
    pub mint_x: Account<'info, Mint>,
    /// Token mint for the Y token
    pub mint_y: Account<'info, Mint>,
    /// User's associated token account for token X
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    /// User's associated token account for token Y
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,
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
    /// Configuration account for the AMM
    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    /// Token program
    pub token_program: Program<'info, Token>,
    /// Associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// System program
    pub system_program: Program<'info, System>,
}

impl<'info> Swap<'info> {
    /// Performs a token swap between X and Y tokens
    /// 
    /// # Arguments
    /// * `is_x` - If true, user is swapping X for Y. If false, user is swapping Y for X
    /// * `amount` - Amount of tokens to swap
    /// * `min` - Minimum amount of tokens to receive in return
    pub fn swap(&mut self, is_x: bool, amount: u64, min: u64) -> Result<()> {
        // Check if pool is not locked
        require!(self.config.locked == false, AmmError::PoolLocked);
        require!(amount > 0, AmmError::InvalidAmount);

        // Initialize the constant product curve with current pool state
        let mut curve = ConstantProduct::init(
            self.vault_x.amount,
             self.vault_y.amount, 
             self.vault_x.amount, 
             self.config.fee,
            None,
        )
        .map_err(AmmError::from)?;

        // Determine which token pair to swap
        let p = match is_x {
            true => LiquidityPair::X,
            false => LiquidityPair::Y,
        };

        // Calculate swap result using constant product formula
        let res = curve.swap(p, amount, min).map_err(AmmError::from)?;

        // Verify the swap amounts are valid
        require!(res.deposit != 0, AmmError::InvalidAmount);
        require!(res.withdraw != 0, AmmError::InvalidAmount);

        // Execute the token transfers
        self.deposit_tokens(is_x, res.deposit)?;
        self.withdraw_tokens(is_x, res.withdraw)?;

        Ok(())
    }

    /// Deposits tokens from user to pool vault
    /// 
    /// # Arguments
    /// * `is_x` - If true, depositing X tokens. If false, depositing Y tokens
    /// * `amount` - Amount of tokens to deposit
    pub fn deposit_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        // Select appropriate token accounts based on which token is being deposited
        let (from, to) = match is_x {
            true => (self.user_x.to_account_info() , self.vault_x.to_account_info()),
            false => (self.user_y.to_account_info(), self.vault_y.to_account_info()),
        };

        let cpi_program = self.token_program.to_account_info();

        // Create transfer instruction
        let accounts = Transfer {
            from: from.to_account_info(),
            to: to.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, accounts);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Withdraws tokens from pool vault to user
    /// 
    /// # Arguments
    /// * `is_x` - If true, withdrawing Y tokens. If false, withdrawing X tokens
    /// * `amount` - Amount of tokens to withdraw
    pub fn withdraw_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        // Select appropriate token accounts based on which token is being withdrawn
        let (from, to) = match is_x {
            true => (self.vault_y.to_account_info() , self.user_y.to_account_info()),
            false => (self.vault_x.to_account_info(), self.user_x.to_account_info()),
        };

        let cpi_program = self.token_program.to_account_info();

        // Create transfer instruction
        let accounts = Transfer {
            from: from.to_account_info(),
            to: to.to_account_info(),
            authority: self.config.to_account_info(),
        };

        // Create signer seeds for PDA
        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, signer_seeds);

        transfer(cpi_ctx, amount)?;

        Ok(())
    }
}