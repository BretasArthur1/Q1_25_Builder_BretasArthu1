use anchor_lang::prelude::*;

pub fn convert_to_token_units(amount: u64, decimals: u8) -> u64 {
    amount * 10u64.pow(decimals as u32)
}

pub fn convert_from_token_units(amount: u64, decimals: u8) -> u64 {
    amount / 10u64.pow(decimals as u32)
}


