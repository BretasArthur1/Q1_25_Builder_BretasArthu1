use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{transfer, Burn, Mint, Token, TokenAccount, Transfer, burn}};
use constant_product_curve::ConstantProduct;

use crate::{errors::AmmError, state::Config};

/// Accounts required for the withdraw instruction
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// The user withdrawing liquidity from the pool
    #[account(mut)]
    pub user: Signer<'info>,
    /// Token X mint account
    pub mint_x: Account<'info, Mint>,
    /// Token Y mint account
    pub mint_y: Account<'info, Mint>,
    /// Pool configuration account that stores important pool parameters
    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,
    /// LP token mint account - represents pool shares
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
    /// User's token account for token X
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    /// User's token account for token Y
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,
    /// User's LP token account
    #[account(
        mut,
        associated_token::mint = mint_lp,
        associated_token::authority = config,
    )]
    pub user_lp: Account<'info, TokenAccount>,
    /// Token program account
    pub token_program: Program<'info, Token>,
    /// System program account
    pub system_program: Program<'info, System>,
    /// Associated token program account
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Withdraw<'info> {
    /// Main withdraw function that handles the withdrawal of liquidity from the pool
    /// 
    /// # Arguments
    /// * `amount` - Amount of LP tokens to burn
    /// * `min_x` - Minimum amount of token X user expects to receive
    /// * `min_y` - Minimum amount of token Y user expects to receive
    pub fn withdraw(
        &mut self,
        amount: u64,
        min_x: u64,
        min_y: u64,
    ) -> Result<()> {
        // Check if pool is not locked
        require!(self.config.locked == false, AmmError::PoolLocked);
        // Validate input amounts
        require!(amount != 0, AmmError::InvalidAmount);
        require!(min_x != 0 || min_y != 0, AmmError::InvalidAmount);

        // Calculate withdrawal amounts based on constant product formula
        let amounts = ConstantProduct::xy_withdraw_amounts_from_l(
            self.vault_x.amount, 
            self.vault_y.amount, 
            self.mint_lp.supply, 
            amount, 
            6,
        )
        .map_err(AmmError::from)?;

        // Verify slippage constraints are met
        require!(min_x <= amounts.x && min_y <= amounts.y, AmmError::SlippageExceeded);

        // Process the withdrawal of both tokens
        self.withdraw_tokens(true, amounts.x)?;
        self.withdraw_tokens(false, amounts.y)?;
        // Burn the LP tokens
        self.burn_lp_tokens(amount)?;
        
        Ok(())
    }

    /// Helper function to withdraw tokens from the pool to the user
    /// 
    /// # Arguments
    /// * `is_x` - Boolean indicating whether to withdraw token X (true) or token Y (false)
    /// * `amount` - Amount of tokens to withdraw
    pub fn withdraw_tokens(&self, is_x: bool, amount: u64) -> Result<()> {
        // Select the appropriate vault and user account based on token type
        let (from, to) = match is_x {
            true => (self.vault_x.to_account_info(), self.user_x.to_account_info()),
            false => (self.vault_y.to_account_info(), self.user_y.to_account_info()),
        };

        let cpi_program = self.token_program.to_account_info();

        // Set up the transfer instruction
        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.config.to_account_info(),
        };

        // Generate the PDA signer seeds
        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Create CPI context with signer seeds and execute transfer
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, amount)?;
        
        Ok(())
    }

    /// Burns the LP tokens after withdrawal
    /// 
    /// # Arguments
    /// * `amount` - Amount of LP tokens to burn
    pub fn burn_lp_tokens(&self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        // Set up the burn instruction
        let cpi_accounts = Burn {
            mint: self.mint_lp.to_account_info(),
            from: self.user_lp.to_account_info(),
            authority: self.user.to_account_info(),
        };

        // Create CPI context and execute burn
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        burn(cpi_context, amount)?;

        Ok(())
    }
}