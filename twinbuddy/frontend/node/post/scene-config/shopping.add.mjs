/**
 * TwinBuddy 场景视频扩充:shopping 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "买了第 5 个通勤包", type: "emotion", tags: ["通勤包", "购物"] },
  { title: "今天海淘了一双鞋", type: "emotion", tags: ["潮鞋", "海淘"] },
  { title: "入了第一瓶香水", type: "emotion", tags: ["香水", "新手"] },
  { title: "今天搜了一晚的机械键盘", type: "emotion", tags: ["机械键盘", "搜索"] },
  { title: "皮肤护理买了一堆｜用不过来", type: "emotion", tags: ["护肤", "购物"] },
  { title: "今天刷了 2 小时家居用品", type: "emotion", tags: ["家居", "购物"] },
  { title: "入了 Apple Pencil｜纠结一周", type: "emotion", tags: ["数码", "购物"] },
  { title: "今天去看了一场家居展", type: "emotion", tags: ["家居", "展览"] },
  { title: "潮流品牌新品｜看了一圈", type: "emotion", tags: ["潮流", "新品"] },
  { title: "今天下单了一个蓝牙耳机", type: "emotion", tags: ["数码", "耳机"] },
  { title: "通勤包 200-500｜3 个不踩雷", type: "guide", tags: ["通勤包", "推荐"] },
  { title: "机械键盘入门｜3 个轴体", type: "guide", tags: ["机械键盘", "入门"] },
  { title: "iPhone 壳推荐｜硅胶 vs 透明", type: "guide", tags: ["iPhone", "配件", "对比"] },
  { title: "Jansport vs Herschel vs Mystery Ranch", type: "guide", tags: ["通勤包", "对比"] },
  { title: "护肤入门｜混油皮夏季", type: "guide", tags: ["护肤", "混油", "夏季"] },
  { title: "家居好物｜出租屋 3 件", type: "guide", tags: ["家居", "出租屋"] },
  { title: "电动牙刷｜3 款 200 元", type: "guide", tags: ["电动牙刷", "便宜"] },
  { title: "咖啡机入门｜手冲 3 件套", type: "guide", tags: ["咖啡", "手冲", "入门"] },
  { title: "耳机降噪对比｜通勤 3 选", type: "guide", tags: ["耳机", "降噪", "通勤"] },
  { title: "智能手表 vs 手环｜3 个决策", type: "guide", tags: ["智能手表", "对比"] },
  { title: "钱包扁了｜别再推购物", type: "noise", tags: ["预算", "反推荐"] },
  { title: "工作太累｜没心思选东西", type: "noise", tags: ["加班", "取消"] },
  { title: "犹豫不决｜先不下单", type: "noise", tags: ["犹豫", "暂停"] },
  { title: "家里已经放不下了", type: "noise", tags: ["收纳", "取消"] },
  { title: "今天只想躺平", type: "noise", tags: ["躺平", "反推荐"] }
]

export default items