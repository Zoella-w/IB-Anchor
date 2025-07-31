import * as anchor from '@coral-xyz/anchor'
import { program } from './const'
import { PublicKey } from '@solana/web3.js'

// 计算 ETF mint account 地址
// - "etf_token_v3"
// - symbol
export function deriveEtfTokenMintAccount(symbol: string) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('etf_token_v3'), Buffer.from(symbol)],
    program.programId,
  )
}

// 计算 ETF token_info 的地址（根据 ETF 的 symbol 或 mint_account 地址）
// - "etf_token_v3"
// - ETF mint account
export function deriveEtfInfoAccount(seeds: string | PublicKey) {
  let mintAccount: PublicKey

  if (typeof seeds === 'string') {
    ;[mintAccount] = deriveEtfTokenMintAccount(seeds)
  } else {
    mintAccount = seeds
  }

  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('etf_token_v3'), mintAccount.toBuffer()],
    program.programId,
  )
}
