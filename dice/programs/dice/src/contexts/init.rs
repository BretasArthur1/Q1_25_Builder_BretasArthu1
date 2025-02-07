use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

/// Accounts required for initializing the house vault
#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(mut)]
    pub house: Signer<'info>,         // House account that will manage the vault
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,   // PDA vault that will hold house funds
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info>{
    /// Initialize the house vault with initial funds
    /// * `amount` - Initial amount of lamports to deposit into the vault
    pub fn init(&mut self, amount: u64) -> Result<()> {
        // Create CPI context for the transfer
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.house.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Transfer initial funds from house to vault
        transfer(cpi_ctx, amount)
    }
}