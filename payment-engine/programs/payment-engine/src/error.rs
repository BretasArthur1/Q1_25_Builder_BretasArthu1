use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid token amount.")]
    InvalidTokenAmount,
    #[msg("User signature not verified.")]
    SignatureNotVerified,
    #[msg("Plan not found.")]
    PlanNotFound,
    #[msg("Arithmetic overflow.")]
    MathOverflow,
    #[msg("Invalid mint.")]
    InvalidMint,
}

