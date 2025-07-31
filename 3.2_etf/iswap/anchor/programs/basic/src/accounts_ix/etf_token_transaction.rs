use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::states::EtfToken;

#[derive(Accounts)]
pub struct EtfTokenTransaction<'info> {
    #[account(
        seeds = [
            EtfToken::SEED_PREFIX.as_bytes(),
            etf_token_mint_account.key().as_ref()
        ],
        bump
    )]
    pub etf_token_info: Account<'info, EtfToken>,

    #[account(mut)]
    pub etf_token_mint_account: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = etf_token_mint_account,
        associated_token::authority = authority
    )]
    pub etf_token_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
