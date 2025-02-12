use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::state::swquery_escrow::SwqueryEscrow;
use crate::state::plan::Plan;
use crate::state::user_account::UserAccount;
use crate::error::ErrorCode;
use crate::constants::TEST_USDC_MINT;
use crate::events::TransactionSuccessful;
#[derive(Accounts)]
#[instruction(seed: u64, plan_id: u64)]
pub struct MakeEscrow<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = SwqueryEscrow::INIT_SPACE,
        seeds = [b"escrow", user.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, SwqueryEscrow>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserAccount::INIT_SPACE,
        seeds = [b"user", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    /// The mint of the token usdc token
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: This is the SWQuery account that will receive the payment. It's safe because we only use it as a destination for payments
    pub swquery: AccountInfo<'info>,

    /// CHECK: This is the user's token account that will be debited. It's safe because we only use it as a source for payments
    #[account(mut)]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is the SWQuery's token account that will be credited. It's safe because we only use it as a destination for payments
    #[account(mut)]
    pub swquery_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> MakeEscrow<'info> {
    /// Updates the escrow account with the details of the selected plan.
    pub fn save_escrow(&mut self, seed: u64, plan: &Plan, bumps: &MakeEscrowBumps) -> Result<()> {
        self.escrow.set_inner(SwqueryEscrow {
            seed,
            bump: bumps.escrow,
            swquery: self.swquery.key(),
            usdc_mint: self.usdc_mint.key(),
            usdc_amount: plan.price,
            selected_plan: Some(plan.clone()),
        });
        Ok(())
    }

    /// Transfers tokens from the user's account to the SWQuery account using transfer_checked.
    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let transfer_accounts = TransferChecked {
            from: self.user_token_account.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
            to: self.swquery_token_account.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_accounts);
        transfer_checked(cpi_ctx, deposit, self.usdc_mint.decimals)
    }

    /// Executes the complete operation: deposits the tokens, saves the escrow data, and updates the user account.
    pub fn make_escrow(&mut self, seed: u64, plan_id: u64, bumps: &MakeEscrowBumps) -> Result<()> {
        if self.usdc_mint.key() != TEST_USDC_MINT {
            return Err(ErrorCode::InvalidMint.into());
        }
        // Selects the plan based on the plan_id.
        let available_plans = Plan::get_available_plans();
        let selected_plan = available_plans
            .into_iter()
            .find(|p| p.id == plan_id)
            .ok_or(ErrorCode::PlanNotFound)?;

        // Deposits the amount corresponding to the selected plan.
        self.deposit(selected_plan.price)?;

        // Updates the escrow account with the plan details.
        self.save_escrow(seed, &selected_plan, bumps)?;

        // Updates the user account: adds the plan and increments the available requests.
        self.user_account.subscribed_plans.push(selected_plan.clone());
        self.user_account.total_requests = self
            .user_account
            .total_requests
            .checked_add(selected_plan.requests as u64)
            .ok_or(ErrorCode::MathOverflow)?;

        // Emits a TransactionSuccessful event as a trigger for the frontend.
        let clock = Clock::get()?;
        emit!(TransactionSuccessful {
            user: self.user.key(),
            plan_id: selected_plan.id,
            amount: selected_plan.price,
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }
}
