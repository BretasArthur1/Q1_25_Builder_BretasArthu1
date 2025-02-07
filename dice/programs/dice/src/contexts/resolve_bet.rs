use anchor_instruction_sysvar::Ed25519InstructionSignatures;
use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use solana_program::{ed25519_program, hash::hash, sysvar::instructions::load_instruction_at_checked};

use crate::{state::Bet, error::CustomError};

/// Accounts required for resolving a bet
#[derive(Accounts)]
pub struct ResolveBet<'info>{
    pub house: Signer<'info>,          // House account that signs the resolution
    #[account(mut)]
    pub player: SystemAccount<'info>,   // Player account to receive potential winnings
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,    // PDA vault holding house funds
    #[account(
        mut,
        close = player,
        seeds = [b"bet", vault.key().as_ref(), bet.seed.to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,       // Bet account to be resolved
    pub instructions_sysvar: AccountInfo<'info>,  // Required for Ed25519 signature verification
    pub system_program: Program<'info, System>,
}

impl<'info> ResolveBet<'info>{
    /// Verify the Ed25519 signature from the house
    /// This ensures the house has approved this bet resolution
    pub fn verify_ed25519_signature(&mut self, sig: &[u8]) -> Result<()> {
        // Load the Ed25519 instruction for verification
        let ix = load_instruction_at_checked(
            0,
            &self.instructions_sysvar.to_account_info()
        )?;

        // Verify the instruction is from Ed25519 program
        require_keys_eq!(ix.program_id, ed25519_program::ID, CustomError::InvalidSignature);
        require_eq!(ix.accounts.len(), 0, CustomError::InvalidSignature);

        // Extract and verify signature data
        let signatures = Ed25519InstructionSignatures::unpack(&ix.data)?.0;
        require_eq!(signatures.len(), 1, CustomError::InvalidSignature);
        let signature = &signatures[0];

        // Verify signature properties
        require!(signature.is_verifiable, CustomError::InvalidSignature);
        require_keys_eq!(signature.public_key.unwrap(), self.house.key(), CustomError::InvalidSignature);
        require!(signature.signature.unwrap().eq(sig), CustomError::InvalidSignature);
        require!(signature.message.as_ref().unwrap().eq(&self.bet.to_slice()), CustomError::InvalidSignature);

        Ok(())
    }

    /// Process the bet resolution and transfer winnings if player won
    pub fn resolve_bet(&mut self, sig: &[u8], bumps: &ResolveBetBumps) -> Result<()> {
        // Generate random roll using signature hash
        let hash = hash(sig).to_bytes();

        // Split hash into two 128-bit numbers
        let mut hash_16: [u8; 16] = [0; 16];
        hash_16.copy_from_slice(&hash[0..16]);
        let lower = u128::from_le_bytes(hash_16);

        hash_16.copy_from_slice(&hash[16..32]);
        let upper = u128::from_le_bytes(hash_16);

        // Calculate final roll (1-100)
        let roll = lower
            .wrapping_add(upper)
            .wrapping_rem(100) as u8 + 1;

        // If player won (bet roll > actual roll), calculate and transfer payout
        if self.bet.roll > roll {
            // Calculate payout with 1.5% house edge
            let payout = (self.bet.amount as u128)
                .checked_mul(10000 - 150 as u128).unwrap()
                .checked_div(self.bet.roll as u128).unwrap()
                .checked_div(10000).unwrap() as u64;

            // Transfer winnings to player
            let cpi_program = self.system_program.to_account_info();
            let cpi_accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.player.to_account_info(),
            };

            let seeds = [b"vault", &self.house.key().to_bytes()[..], &[bumps.vault]];
            let signer_seeds = &[&seeds[..]][..];
            let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

            transfer(cpi_context, payout)?;
        }

        Ok(())
    }
}
