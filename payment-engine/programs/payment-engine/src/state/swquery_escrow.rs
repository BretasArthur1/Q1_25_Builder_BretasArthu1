use anchor_lang::prelude::*;
use crate::plan::Plan;

#[account]
pub struct SwqueryEscrow {
    pub seed: u64, // Seed for the escrow
    pub bump: u8, // Bump for the escrow

    pub swquery: Pubkey, // Project account receiving the funds

    pub usdc_mint: Pubkey, // USDC token mint

    pub usdc_amount: u64, // Amount of USDC to be transferred

    pub selected_plan: Option<Plan>, // Plan selected by the user
}

impl SwqueryEscrow {
    pub const INIT_SPACE: usize = 8 // anchor discriminator
        + 8 // seed: u64
        + 1 // bump: u8
        + 32 // swquery: Pubkey
        + 32 // usdc_mint: Pubkey
        + 8 // usdc_amount: u64
        + 4 // Option<Plan> length prefix
        + Plan::INIT_SPACE; // Plan struct size
}


