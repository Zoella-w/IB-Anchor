use anchor_lang::prelude::*;

declare_id!("6hU5Vo6Njg2Mk7eaBrtLeoLLhagobC4VjPQ6zKrNP2eR");

pub mod accounts_ix;
pub mod instructions;
pub mod states;

use accounts_ix::*;
use instructions::*;

#[program]
pub mod basic {
    use super::*;

    pub fn greet(_ctx: Context<Initialize>) -> Result<()> {
        msg!("GM!");
        Ok(())
    }

    // 创建 ETF token
    pub fn etf_create(ctx: Context<EtfTokenCreate>, args: EtfTokenArgs) -> Result<()> {
        // instructions::etf_token_create(ctx, args)
        etf_token_create(ctx, args)
    }

    // 购买 ETF
    // - 完成用户资产转移
    // - 给用户 mint token
    pub fn etf_mint<'info>(
        ctx: Context<'_, '_, '_, 'info, EtfTokenTransaction<'info>>,
        lamports: u64,
    ) -> Result<()> {
        // instructions::etf_token_mint(ctx, lamports)
        etf_token_mint(ctx, lamports)
    }

    // 赎回 ETF
    // - 销毁 token
    // - 返还用户资产
    pub fn etf_burn<'info>(
        ctx: Context<'_, '_, '_, 'info, EtfTokenTransaction<'info>>,
        lamports: u64,
    ) -> Result<()> {
        // instructions::etf_token_burn(ctx, lamports)
        etf_token_burn(ctx, lamports)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
