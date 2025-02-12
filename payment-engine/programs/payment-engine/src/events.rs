use anchor_lang::prelude::*;

#[event]
pub struct TransactionSuccessful {
    pub user: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
    pub timestamp: i64,
}
