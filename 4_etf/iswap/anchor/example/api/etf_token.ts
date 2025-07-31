import * as anchor from '@coral-xyz/anchor'
import { program, provider } from './const'
import { PublicKey } from '@solana/web3.js'
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TokenAccountNotFoundError,
} from '@solana/spl-token'
import { deriveEtfInfoAccount } from './address'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'

export async function createETF(
  wallet: anchor.Wallet,
  name: string,
  symbol: string,
  description: string,
  url: string,
  assets: {
    token: PublicKey
    weight: number
  }[],
) {
  const [etfTokenInfoAddress] = deriveEtfInfoAccount(symbol)

  let tx = new anchor.web3.Transaction()

  // 为每个 Token 创建 ATA
  for (const { token } of assets) {
    const address = getAssociatedTokenAddressSync(
      token,
      etfTokenInfoAddress,
      true, // allow owner account to be PDA
    )
    try {
      const ata = await getAccount(provider.connection, address)
      console.log(ata.address.toString())
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        // 创建 ATA
        tx.add(
          createAssociatedTokenAccountInstruction(
            wallet.payer.publicKey,
            address, // ATA
            etfTokenInfoAddress, // owner
            token,
          ),
        )
        console.log('create associated token account success')
      }
    }
  }

  tx.add(
    await program.methods
      .etfCreate({
        name,
        symbol,
        description,
        url,
        assets,
      })
      .transaction(),
  )

  return await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [wallet.payer])
}

// 购买 lamports 金额 的地址为 etfAddress 的 ETF
// - 创建「用户 与 etf_token」的 ATA 账户 & 「token_info 与 etf_token」的 ATA 账户
// - 完成用户的资产转移 & 给用户 mint token
export async function tokenMint(
  wallet: anchor.Wallet,
  etfAddress: PublicKey, // ETF 的 mint_account 地址
  lamports: number,
) {
  // ----- 创建「用户 与 etf_token」的 ATA 账户 & 「token_info 与 etf_token」的 ATA 账户 -----

  // 获取 ETF token_info 的地址
  const [etfTokenInfoAddress] = deriveEtfInfoAccount(etfAddress)
  // 根据 ETF token_info 的地址，获取其账户
  const etfInfo = await program.account.etfToken.fetch(etfTokenInfoAddress)

  const accounts = etfInfo.assets.flatMap((item) => {
    return [
      // 「用户 与 etf_token」的 ATA 账户
      getAssociatedTokenAddressSync(
        item.token, // etf mint_account
        wallet.publicKey, // owner 为当前用户
      ),
      // 「token_info 与 etf_token」的 ATA 账户
      getAssociatedTokenAddressSync(
        item.token, // etf mint_account
        etfTokenInfoAddress, // owner 为 token_info
        true, // 当前为 PDA（仅被智能合约控制的账户）
      ),
    ]
  })

  // ----- 完成用户的资产转移 & 给用户 mint token -----

  return await program.methods
    .etfMint(new anchor.BN(lamports))
    .accounts({
      etfTokenMintAccount: etfAddress,
    })
    .remainingAccounts(
      // 将账户 publickey 转换为 metadata
      accounts.map((item) => ({
        pubkey: item,
        isSigner: false,
        isWritable: true,
      })),
    )
    .rpc()
}

// 赎回 lamports 金额 的地址为 etfAddress 的 ETF
// - 创建「用户 与 etf_token」的 ATA 账户 & 「token_info 与 etf_token」的 ATA 账户
// - 返还用户的资产 & 销毁 etf_token
export async function tokenBurn(
  wallet: anchor.Wallet,
  etfAddress: PublicKey, // ETF 的 mint_account 地址
  lamports: number,
) {
  // ----- 创建「用户 与 etf_token」的 ATA 账户 & 「token_info 与 etf_token」的 ATA 账户 -----

  // 获取 ETF token_info 的地址
  const [etfTokenInfoAddress] = deriveEtfInfoAccount(etfAddress)
  // 根据 ETF token_info 的地址，获取其账户
  const etfInfo = await program.account.etfToken.fetch(etfTokenInfoAddress)

  const accounts = etfInfo.assets.flatMap((item) => {
    return [
      // 「用户 与 etf_token」的 ATA 账户
      getAssociatedTokenAddressSync(
        item.token, // etf mint_account
        wallet.publicKey, // owner 为当前用户
      ),
      // 「token_info 与 etf_token」的 ATA 账户
      getAssociatedTokenAddressSync(
        item.token, // etf mint_account
        etfTokenInfoAddress, // owner 为 token_info
        true, // 当前为 PDA（仅被智能合约控制的账户）
      ),
    ]
  })

  // ----- 返还用户的资产 & 销毁 etf_token -----

  return await program.methods
    .etfBurn(new anchor.BN(lamports))
    .accounts({
      etfTokenMintAccount: etfAddress,
    })
    .remainingAccounts(
      // 将账户 publickey 转换为 metadata
      accounts.map((item) => ({
        pubkey: item,
        isSigner: false,
        isWritable: true,
      })),
    )
    .rpc()
}

// 获取 etf mint_account 列表
export async function etfList() {
  const etfInfo = await program.account.etfToken.all()
  return etfInfo.map((item) => item.account.mintAccount.toString())
}

// 获取 mint_account 地址为 etfAddress 的 token_info
export async function etfDetail(wallet: anchor.Wallet, etfAddress: PublicKey) {
  //   // 只有 mint_account 基础数据，没有 metadata
  //   let mintAccount = await getMint(provider.connection, etfAddress)
  //   return mintAccount

  // 获取 etf token_info 的基础信息
  // 获取 etf token_info 地址
  const [etfTokenInfoAddress] = deriveEtfInfoAccount(etfAddress)
  // 根据 etf token_info 地址，获取其账户
  const etfInfo = await program.account.etfToken.fetch(etfTokenInfoAddress)

  // 使用 umi 插件
  const umi = createUmi(provider.connection.rpcEndpoint)
  umi.use(mplTokenMetadata())
  // 额外包含了 metadata 信息
  const mintAccount = await fetchDigitalAsset(umi, fromWeb3JsPublicKey(etfAddress))

  // 获取 logo 信息
  let logo = ''
  if (mintAccount.metadata.uri) {
    const response = await fetch(mintAccount.metadata.uri)
    const rj: any = await response.json()
    logo = rj.image
  }

  // 将信息拼接
  return {
    public_key: etfAddress.toString(),
    supply: mintAccount.mint.supply,
    decimal: mintAccount.mint.decimals,
    name: mintAccount.metadata.name,
    symbol: mintAccount.metadata.symbol,
    description: etfInfo.descriptor,
    creator: etfInfo.creator.toString(),
    create_at: etfInfo.createAt.toNumber(),
    logo: logo,
  }
}

// 获取 mint_account 为 etfAddress 的 token 余额（存储在 与用户钱包 的 ATA 账户中）
export async function etfBalance(wallet: anchor.Wallet, etfAddress: PublicKey) {
  // 获取 用户钱包 与「地址为etfAddress的mint_account」的 ATA 账户地址
  const ata = getAssociatedTokenAddressSync(etfAddress, wallet.publicKey)

  // 根据 ATA 账户地址，获取其账户
  const ta = await getAccount(provider.connection, ata)
  return ta.amount
}
