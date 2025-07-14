// 导入 Anchor 框架的核心模块和 Program 类型
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

// 导入从 IDL 自动生成的 Counter 程序类型
import { Counter } from "../target/types/counter";

// 测试套件：测试计数器智能合约
describe("counter", () => {
  // 配置客户端使用本地 Solana 集群
  const provider = anchor.AnchorProvider.env();
  // 设置全局提供者（连接到本地测试验证器）
  anchor.setProvider(anchor.AnchorProvider.env());

  // 获取本地默认钱包（来自 Anchor.toml 配置）
  const wallet = provider.wallet as anchor.Wallet;

  // 从工作区获取已部署的 Counter 程序实例
  const program = anchor.workspace.counter as Program<Counter>;

  const [counterKeypair, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), wallet.publicKey.toBytes()],
    program.programId
  );
  // 打印新账户的公钥（用于调试）
  console.log("counterKeypair's publicKey is:", counterKeypair.toString());

  // // 测试用例 1：初始化计数器账户
  // it("Is initialized!", async () => {
  //   // // 新建密钥对（用于计数器账户）
  //   // const counterKeypair = new anchor.web3.Keypair();
  //   // // 打印新账户的公钥（用于调试）
  //   // console.log("counterKeypair's publicKey is:", counterKeypair.publicKey.toString());

  //   // 调用程序的 initialize 方法
  //   const tx = await program.methods
  //     .initialize() // 调用初始化指令
  //     .accounts({
  //       // 指定所需的账户
  //       payer: wallet.publicKey, // 支付交易费用的账户
  //       // counter: counterKeypair, // 要创建的计数器账户
  //     })
  //     // // 指定交易的签名者：
  //     // // 1. wallet.payer - 支付账户的签名者
  //     // // 2. counterKeypair - 新计数器账户的签名者
  //     // // 注意：新账户需要签名授权创建
  //     // .signers([wallet.payer, counterKeypair])
  //     .signers([wallet.payer])
  //     // 发送交易到区块链（RPC 调用）
  //     .rpc();
  //   // 打印交易签名（区块链上的交易 ID）
  //   console.log("Your transaction signature is:", tx);
  // });

  // 测试用例 2：增加计数器值
  it("Increment counter", async () => {
    // 硬编码之前创建的计数器公钥（应与初始化测试中打印的值匹配）
    // const conunterPubkey = new anchor.web3.PublicKey(
    //   "F8Uwskw3Y55AJ7q9miPWvcAJL2DSWfbRi3MfYvugbLRi"
    // );

    const conunterPubkey = counterKeypair;

    // 调用程序的 increment 方法
    await program.methods
      .increment() // 调用增加指令
      .accounts({
        counter: conunterPubkey, // 要操作的计数器账户
      })
      // 注意：没有明确指定签名者，默认使用当前 provider 的钱包
      .rpc(); // 发送交易
  });

  // 测试用例 3：读取计数器值
  it("Read counter", async () => {
    // // 使用相同的硬编码公钥
    // const conunterPubkey = new anchor.web3.PublicKey(
    //   "F8Uwskw3Y55AJ7q9miPWvcAJL2DSWfbRi3MfYvugbLRi"
    // );

    const conunterPubkey = counterKeypair;
    // 从区块链获取计数器账户状态
    const currentCount = await program.account.counter.fetch(conunterPubkey);

    // 打印当前计数器值
    console.log("currentCount's value is:", currentCount);
    // 预期输出示例：{ count: <BN: 0> } 或 { count: <BN: 1> }
    // BN 表示大数类型（Big Number），需要通过 .toString() 转换为字符串
  });
});
