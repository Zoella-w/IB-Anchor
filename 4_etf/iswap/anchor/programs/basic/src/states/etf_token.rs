use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct EtfToken {
    pub mint_account: Pubkey,
    pub creator: Pubkey,
    pub create_at: i64,

    #[max_len(50)]
    pub descriptor: String,

    #[max_len(10)]
    pub assets: Vec<EtfAsset>,
}

#[account]
#[derive(InitSpace)]
pub struct EtfAsset {
    pub token: Pubkey,
    pub weight: u16,
}

impl EtfToken {
    pub const SEED_PREFIX: &'static str = "etf_token_v3";

    pub const TOKEN_DECIMALS: u8 = 9;
}

#[error_code]
pub enum TokenMintError {
    #[msg("Lack of necessary accounts")]
    InvalidAccounts,
}
