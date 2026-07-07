/**
 * TwinBuddy 场景视频扩充:trip 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "刚爬完梧桐山｜腿已经不是自己的了", type: "emotion", tags: ["梧桐山", "徒步", "疲惫"] },
  { title: "大鹏的海比想象中蓝｜但人也多", type: "emotion", tags: ["大鹏", "海", "周末"] },
  { title: "深圳湾骑行｜风把我发型吹没了", type: "emotion", tags: ["深圳湾", "骑行", "风"] },
  { title: "梅沙尖的雾大到我以为成仙了", type: "emotion", tags: ["梅沙尖", "雾", "徒步"] },
  { title: "周日早上 9 点公园只有 3 个人", type: "emotion", tags: ["公园", "周日", "安静"] },
  { title: "加班完去夜骑深圳湾｜风凉得正好", type: "emotion", tags: ["夜骑", "深圳湾", "下班"] },
  { title: "跟室友去了顺德｜一天吃了 5 顿", type: "emotion", tags: ["顺德", "室友", "美食"] },
  { title: "凌晨 4 点的深圳湾风有点冷", type: "emotion", tags: ["深圳湾", "凌晨", "风"] },
  { title: "从化温泉回来皮肤滑了 3 天", type: "emotion", tags: ["从化", "温泉", "体验"] },
  { title: "本来想爬梧桐山｜结果在下雨", type: "emotion", tags: ["梧桐山", "雨天", "计划泡汤"] },
  { title: "深圳周末 2 天 1 夜｜不走回头路", type: "guide", tags: ["深圳", "周末", "2天1夜"] },
  { title: "大鹏南澳｜4 个不踩雷的拍照点", type: "guide", tags: ["大鹏", "南澳", "拍照"] },
  { title: "西涌 CP 沙滩｜适合下午 3 点去", type: "guide", tags: ["西涌", "沙滩", "下午"] },
  { title: "广州沙面岛｜半天 citywalk", type: "guide", tags: ["广州", "沙面", "citywalk"] },
  { title: "深圳天文台预约｜3 个 tips", type: "guide", tags: ["天文台", "预约", "tips"] },
  { title: "惠州双月湾｜周末 2 天不堵车攻略", type: "guide", tags: ["惠州", "双月湾", "周末"] },
  { title: "顺德 + 美食｜2 天 1 夜", type: "guide", tags: ["顺德", "美食", "周末"] },
  { title: "从化温泉｜秋冬人均 200 攻略", type: "guide", tags: ["从化", "温泉", "秋冬"] },
  { title: "华强北 coffee walk｜3 家独立", type: "guide", tags: ["华强北", "咖啡", "citywalk"] },
  { title: "蛇口老街一日 walk", type: "guide", tags: ["蛇口", "老街", "citywalk"] },
  { title: "华侨城创意园｜周末能逛 3 小时", type: "guide", tags: ["华侨城", "创意园", "周末"] },
  { title: "南头古城半天 plan", type: "guide", tags: ["南头古城", "文创", "半天"] },
  { title: "南澳第一沙滩｜不用早起", type: "guide", tags: ["南澳", "沙滩", "慢"] },
  { title: "华强北 + 中心公园｜半日 plan", type: "guide", tags: ["华强北", "中心公园", "半日"] },
  { title: "深圳小众海边：金沙湾", type: "guide", tags: ["金沙湾", "小众", "海边"] },
  { title: "钱包扁了｜别再推任何旅行", type: "noise", tags: ["预算", "反推荐"] },
  { title: "今晚只想宅家｜出门计划搁浅", type: "noise", tags: ["宅家", "取消"] },
  { title: "加班到 12 点｜关掉周末推送", type: "noise", tags: ["加班", "关推"] },
  { title: "想请假又不敢｜心情复杂", type: "noise", tags: ["请假", "情绪"] },
  { title: "周末下雨｜户外计划全废", type: "noise", tags: ["雨天", "取消"] }
]

export default items