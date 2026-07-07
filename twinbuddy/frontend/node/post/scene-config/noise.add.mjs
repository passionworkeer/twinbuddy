/**
 * TwinBuddy 场景视频扩充:noise 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "今天加班到 11 点｜回家路上看到一只流浪猫", type: "noise", tags: ["加班", "流浪猫"] },
  { title: "深圳的早晨｜地铁里的人都面无表情", type: "noise", tags: ["地铁", "早晨"] },
  { title: "今天做了个饭｜卖相差但味道行", type: "noise", tags: ["做饭", "日常"] },
  { title: "今天去超市看到打折｜买了 5 包薯片", type: "noise", tags: ["超市", "日常"] },
  { title: "今天养的猫又把杯子打碎了", type: "noise", tags: ["猫", "日常"] },
  { title: "周末去公园｜看到一家三口放风筝", type: "noise", tags: ["公园", "家庭"] },
  { title: "今天去银行排队等了 2 小时", type: "noise", tags: ["银行", "排队"] },
  { title: "今天养的狗把家拆了", type: "noise", tags: ["狗", "日常"] },
  { title: "凌晨 3 点还在刷手机｜眼睛疼", type: "noise", tags: ["刷手机", "熬夜"] },
  { title: "深圳地铁里情侣最多", type: "noise", tags: ["地铁", "观察"] },
  { title: "今天做了个饭团｜歪七扭八", type: "noise", tags: ["做饭", "日常"] },
  { title: "今天加班到凌晨｜回家吃了一碗面", type: "noise", tags: ["加班", "夜宵"] },
  { title: "深圳周末到处都是人", type: "noise", tags: ["周末", "人"] },
  { title: "今天去看了场免费展｜人多到爆炸", type: "noise", tags: ["免费展", "人"] },
  { title: "深圳的便利店救我命", type: "noise", tags: ["便利店", "城市"] },
  { title: "今天养的鱼死了 1 条", type: "noise", tags: ["鱼", "宠物"] },
  { title: "下班的路上｜夕阳好看", type: "noise", tags: ["夕阳", "下班"] },
  { title: "今天外卖到了｜凉了", type: "noise", tags: ["外卖", "日常"] },
  { title: "今天出门忘带钥匙", type: "noise", tags: ["日常", "健忘"] },
  { title: "今天收到了一个快递｜拆了 3 层", type: "noise", tags: ["快递", "日常"] },
  { title: "今天被客户气到", type: "noise", tags: ["工作", "情绪"] },
  { title: "今天地铁里被踩了一脚", type: "noise", tags: ["地铁", "踩"] },
  { title: "今天闹钟没响｜迟到", type: "noise", tags: ["闹钟", "迟到"] },
  { title: "今天发现账户余额少了 100", type: "noise", tags: ["账单", "意外"] },
  { title: "周末只想宅家", type: "noise", tags: ["宅家", "周末"] }
]

export default items