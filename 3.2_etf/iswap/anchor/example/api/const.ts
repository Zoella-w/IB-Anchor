import * as anchor from '@coral-xyz/anchor'

import { Basic as Iswap } from '../../target/types/basic'

let provider = anchor.AnchorProvider.env()
anchor.setProvider(provider)

const program = anchor.workspace.Basic as anchor.Program<Iswap>

export { program, provider }

export function useDefaultWallet() {
  const wallet = anchor.Wallet.local()
  return wallet
}
