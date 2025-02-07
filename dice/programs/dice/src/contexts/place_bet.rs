use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use crate::state::Bet;

/// Accounts required for placing a bet
#[derive(Accounts)]
#[instruction(seed: u128)]
pub struct PlaceBet<'info>{
    #[account(mut)]
    pub player: Signer<'info>,          // Player placing the bet
    pub house: SystemAccount<'info>,     // House account
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,     // PDA vault holding house funds

    #[account(
        init,
        payer = player,
        seeds = [b"bet", vault.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
        space = 8 + Bet::INIT_SPACE,
    )]
    pub bet: Account<'info, Bet>,        // New bet account to store bet details
    pub system_program: Program<'info, System>,
}

impl<'info> PlaceBet<'info>{
    /// Creates a new bet with the specified parameters
    pub fn create_bet(&mut self, seed: u128, amount: u64, roll: u8, bumps: &PlaceBetBumps) -> Result<()> {
       self.bet.set_inner(Bet{
        player: self.player.key(),
        seed,
        amount,
        slot: Clock::get()?.slot,
        roll,
        bump: bumps.bet,
       });
       Ok(())
    }

    /// Transfers bet amount from player to vault
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.player.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, amount)     
    }
}