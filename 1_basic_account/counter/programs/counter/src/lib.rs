use anchor_lang::prelude::*; // 导入 Anchor 的主要预置模块（账户处理、安全验证等）

// 声明程序的链上地址/ID（部署时 Solana 网络会验证匹配性）
declare_id!("Az8uxcYnbRTywagSeVyC6Buo8k64i22CRcCp5F9quYWR");

// 标识下面的模块是可执行程序逻辑模块（类似智能合约），是程序的主要逻辑
#[program]
pub mod counter {
    // 定义名为 counter 的模块
    use super::*; // 导入父模块的所有内容

    // 初始化计数器账户的函数
    // ctx 是什么？
    // - 类型​​: Context<T>（其中 T 是账户验证结构如 InitializeCounter 或 Increment）
    // - 本质​​：Anchor 为每个智能合约方法封装的安全执行上下文
    pub fn initialize(ctx: Context<InitializeCounter>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id); // 打印日志
        Ok(()) // 返回成功
    }

    // 递增计数函数
    // ctx.accounts 是什么？​​
    // ​- ​类型​​：泛型结构（根据函数不同而变），这里是 Increment 实例
    // ​​- 功能​​：
    //  - 包含所有​​预先验证过​​的「账户集合」引用（这里是 Increment 实例，其 accounts 中包含 counter）
    //  - Anchor 已检查每个账户：
    //      - 所有权是否正确
    //      - 签名是否有效（对需要签名的账户）
    //      - 可变性是否允许（mut 标记）
    //      - 空间是否足够（space 约束）
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // 安全的加法操作（防止整数溢出）
        // ctx.accounts​​: 访问验证过的账户（Anchor 已确保类型和权限正确）
        ctx.accounts.counter.count = ctx.accounts.counter.count.checked_add(1).unwrap();
        Ok(())
    }
}

// 账户集合：用于 initialize 函数的账户验证
#[derive(Accounts)] // 标识这是一个账户验证结构
pub struct InitializeCounter<'info> {
    #[account(mut)] // 标识 payer 账户可变（因为要付租金，需要签名写权限）
    // Signer<'info> 验证该账户是交易的合法签名者
    pub payer: Signer<'info>, // 付款人，同时也是交易的签名者

    #[account(
        init, // 表示要初始化这个账户
        payer = payer, // 付款人是上面定义的 payer
        space = 8 + 8, // 分配空间：8字节（账户标识）+ 8字节（u64 计数器）
        // seeds 和 bump 说明是 PDA
        seeds = [b"counter", payer.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>, // 计数器账户

    pub system_program: Program<'info, System>, // 必须传入系统程序
}

// 账户集合：用于 increment 函数的账户验证
#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)] // 标识计数器账户可变（因为要修改它）
    // Account<'info, T> 类型安全的账户（T 需实现 #[account]）
    pub counter: Account<'info, Counter>, // 计数器账户
}

// Anchor 数据容器
#[account]
pub struct Counter {
    count: u64, // 定义计数器字段
}
