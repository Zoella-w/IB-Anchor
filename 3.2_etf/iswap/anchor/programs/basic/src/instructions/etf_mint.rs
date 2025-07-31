use std::collections::HashMap;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{mint_to, transfer, MintTo, Transfer},
};

use crate::accounts_ix::EtfTokenTransaction;
use crate::states::{EtfToken, TokenMintError};

// 完成用户的资产转移 & 给用户 mint token
pub fn etf_token_mint<'info>(
    // Accounts, Instructions, remaining_accounts, AccountInfo（显示）, Accounts结构体类型EtfTokenTransaction
    ctx: Context<'_, '_, '_, 'info, EtfTokenTransaction<'info>>,
    lamports: u64,
) -> Result<()> {
    // ----- 完成用户的资产转移 -----
    // remaining_accounts 实现不定长账户的传递
    // 将所有账户转换为 (地址, 账户) 的 HashMap
    let accounts = ctx
        .remaining_accounts
        .iter()
        .map(|x| (x.key(), x.to_owned()))
        .collect::<HashMap<_, _>>();

    // 对 token info 中的资产进行遍历
    for x in &ctx.accounts.etf_token_info.assets {
        // 先通过 get_associated_token_address 获取 ATA 地址，再获取对应的 ATA 账户

        // 1. 获取「用户 与 etf_token」的 ATA 账户
        let from_ata = accounts
            .get(&get_associated_token_address(
                &ctx.accounts.authority.key(),
                &x.token,
            ))
            .ok_or(TokenMintError::InvalidAccounts)?;

        // 2. 获取「token_info 与 etf_token」的 ATA 账户
        let to_ata = accounts
            .get(&get_associated_token_address(
                &ctx.accounts.etf_token_info.key(),
                &x.token,
            ))
            .ok_or(TokenMintError::InvalidAccounts)?;

        let amount = x.weight as u64 * lamports / 100;

        // 从「用户与etf_token 的 ATA 账户」转移到「token_info与etf_token 的 ATA 账户」
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: from_ata.to_account_info(),
                    to: to_ata.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
    }

    // ----- 给用户 mint token -----

    let binding = ctx.accounts.etf_token_mint_account.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        EtfToken::SEED_PREFIX.as_bytes(),
        binding.as_ref(),
        &[ctx.bumps.etf_token_info],
    ]];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.etf_token_mint_account.to_account_info(),
                to: ctx.accounts.etf_token_ata.to_account_info(),
                authority: ctx.accounts.etf_token_info.to_account_info(),
            },
            signer_seeds,
        ),
        lamports,
    )?;

    Ok(())
}
