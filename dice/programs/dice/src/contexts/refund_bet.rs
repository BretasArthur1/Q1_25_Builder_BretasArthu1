use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use crate::{state::Bet, error::CustomError};

/// Accounts required for refunding a bet
#[derive(Accounts)]
pub struct RefundBet<'info>{
    #[account(mut)]
    pub player: Signer<'info>,          // Player requesting refund
    pub house: SystemAccount<'info>,     // House account
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,     // House vault PDA

    #[account(
        mut,
        close = player,
        seeds = [b"bet", vault.key().as_ref(), bet.seed.to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,        // Bet account to be refunded
    pub system_program: Program<'info, System>,
}

impl<'info> RefundBet<'info>{
    /// Process refund if bet wasn't resolved within timeframe
    pub fn refund_bet(&mut self, bumps: &RefundBetBumps) -> Result<()> {
        let slot = Clock::get()?.slot;
        // Check if enough time has passed (324 slots)
        require!((slot - self.bet.slot) > 324, CustomError::BetNotResolved);
        
        // Transfer funds back to player
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.player.to_account_info(),
        };

        let seeds = [b"vault", &self.house.key().to_bytes()[..], &[bumps.vault]];
        let signer_seeds = &[&seeds[..]][..];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, self.bet.amount)?;
        
        Ok(())
    }
}