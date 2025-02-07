use anchor_lang::error_code;


#[error_code]
pub enum CustomError{
    #[msg("Bet not resolved")]
    BetNotResolved,
    #[msg("Invalid instruction")]
    InvalidInstruction,
    #[msg("Invalid signature verification")]
    InvalidSignature,
}
