use anchor_lang::prelude::*;

declare_id!("9qSchFvHkadxQkSpY8T5sX4iTJRT9go21jFgAWiGLsue");

pub mod state;
pub use state::*;

pub mod instructions;
pub use instructions::*;

pub mod error;
#[allow(unused_imports)]
pub use error::*;


pub mod constants;

pub mod events;
pub use events::*;


#[program]
pub mod payment_engine {
    use super::*;

    pub fn make_escrow(ctx: Context<MakeEscrow>, seed: u64, plan_id: u64) -> Result<()> {
       ctx.accounts.make_escrow(seed, plan_id, &ctx.bumps)
    }
}

