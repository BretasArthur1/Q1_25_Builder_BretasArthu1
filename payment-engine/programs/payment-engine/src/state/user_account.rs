use anchor_lang::prelude::*;
use crate::state::Plan;

#[account]
pub struct UserAccount {
    pub user: Pubkey, // User's public key
    pub total_requests: u64, // Total number of requests available to the user
    pub subscribed_plans: Vec<Plan>, // Plans the user has subscribed to
}

impl UserAccount {
    pub const INIT_SPACE: usize = 8 // anchor discriminator
        + 32 // user: Pubkey
        + 8 // total_requests: u64
        + 4 + (Plan::INIT_SPACE * 3); //maximum of 3 subscribed plans
}
