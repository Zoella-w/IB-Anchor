import { PublicKey } from '@solana/web3.js'
import { deriveEtfTokenMintAccount } from './api/address'
import { useDefaultWallet } from './api/const'
import { createETF, tokenMint, tokenBurn, etfList, etfDetail, etfBalance } from './api/etf_token'
import * as anchor from '@coral-xyz/anchor'
;(async () => {
  const defaultWallet = useDefaultWallet()
  // const [name, symbol, description, url] = [
  //   'yama',
  //   'YAMA',
  //   'yama description',
  //   'https://note-public-img.oss-cn-beijing.aliyuncs.com/nya/nya.json',
  // ]
  // const tx = await createETF(defaultWallet, name, symbol, description, url, [
  //   {
  //     token: new anchor.web3.PublicKey('35bTAL1uQYStmd3LeiqVbSgzwdecSTFCZG9Wu2cMdHq1'),
  //     weight: 10,
  //   },
  //   {
  //     token: new anchor.web3.PublicKey('J4AVxNRzuAUV3MaqizJvBAafF4KjZtYeCyujfAETUxLV'),
  //     weight: 90,
  //   },
  // ])
  // console.log(tx)

  // 通过 symbol 获取 etf mint_account 的地址
  const [etf] = deriveEtfTokenMintAccount('YAMA')
  console.log(etf.toString())

  // // 给 defaultWallet mint 10 etf_token（精度为 9）
  // const r2 = await tokenMint(defaultWallet, etf, 10_000_000_000)
  // console.log(r2)

  // const r3 = await tokenBurn(defaultWallet, etf, 10_000_000_000)
  // console.log(r3)

  // const r4 = await etfList()
  // console.log(r4)

  // const r5 = await etfDetail(defaultWallet, new PublicKey('AUVRtQWpSxD7WZpfGQ3cpdDUQx3MmgrzpMV1ArP8CgfM'))
  // console.log(r5)

  const r6 = await etfBalance(defaultWallet, new PublicKey('AUVRtQWpSxD7WZpfGQ3cpdDUQx3MmgrzpMV1ArP8CgfM'))
  console.log(r6)
})()
