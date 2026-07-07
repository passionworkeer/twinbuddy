/**
 * TwinBuddy 场景视频扩充:study 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "今天读了 1 篇论文｜脑袋炸了", type: "emotion", tags: ["论文", "阅读"] },
  { title: "prompt engineering 第 3 次重写", type: "emotion", tags: ["prompt", "重写"] },
  { title: "AI Agent 入门｜第 1 天就困了", type: "emotion", tags: ["AI", "Agent", "入门"] },
  { title: "今天写了 200 行代码全删了", type: "emotion", tags: ["写代码", "重写"] },
  { title: "刷题 30 分钟｜只 AC 了 1 题", type: "emotion", tags: ["刷题", "AC"] },
  { title: "今天英语打卡｜又是看美剧", type: "emotion", tags: ["英语", "美剧"] },
  { title: "播客听完了 1 期｜很受用", type: "emotion", tags: ["播客", "学习"] },
  { title: "OpenAI API 文档越看越厚", type: "emotion", tags: ["OpenAI", "文档"] },
  { title: "今天调代码到凌晨 4 点", type: "emotion", tags: ["调试", "熬夜"] },
  { title: "读论文读到一半睡着了", type: "emotion", tags: ["论文", "困"] },
  { title: "AI Agent 7 天入门路线", type: "guide", tags: ["AI", "Agent", "路线"] },
  { title: "Prompt Engineering 5 个技巧", type: "guide", tags: ["prompt", "技巧"] },
  { title: "读论文 3 个高效法", type: "guide", tags: ["论文", "阅读", "技巧"] },
  { title: "刷题计划｜前 100 题怎么分", type: "guide", tags: ["刷题", "计划"] },
  { title: "英语听力｜3 个免费材料", type: "guide", tags: ["英语", "听力", "免费"] },
  { title: "写代码 clean｜3 个原则", type: "guide", tags: ["代码", "clean", "原则"] },
  { title: "LangChain 入门｜官方教程精简", type: "guide", tags: ["LangChain", "入门"] },
  { title: "VS Code 调试技巧｜前端 5 个", type: "guide", tags: ["VSCode", "调试", "前端"] },
  { title: "技术播客推荐｜5 个中文", type: "guide", tags: ["播客", "技术", "中文"] },
  { title: "读博日记｜时间管理 3 招", type: "guide", tags: ["读博", "时间", "管理"] },
  { title: "加班到 12 点｜没时间学习", type: "noise", tags: ["加班", "取消"] },
  { title: "今天只想刷手机｜别推学习", type: "noise", tags: ["摸鱼", "反推荐"] },
  { title: "钱包扁了｜停掉付费课", type: "noise", tags: ["预算", "停课"] },
  { title: "周末社交多｜学习计划泡汤", type: "noise", tags: ["社交", "取消"] },
  { title: "今天精力差｜学不进去", type: "noise", tags: ["精力", "暂停"] }
]

export default items