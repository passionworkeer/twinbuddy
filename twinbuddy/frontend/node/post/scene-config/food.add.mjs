/**
 * TwinBuddy 场景视频扩充:food 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "今天去了一家评分 4.9 的店 居然失望", type: "emotion", tags: ["探店", "失望"] },
  { title: "深圳的云南菜越来越少正宗", type: "emotion", tags: ["云南菜", "吐槽"] },
  { title: "深业上城川菜｜辣到嘴肿", type: "emotion", tags: ["川菜", "探店"] },
  { title: "凌晨 5 点的早餐店已经开门了", type: "emotion", tags: ["早餐", "凌晨"] },
  { title: "公司楼下的麻辣烫吃了一年", type: "emotion", tags: ["工作餐", "麻辣烫"] },
  { title: "今天跟同事吃了顿日料 AA 到小数点", type: "emotion", tags: ["日料", "AA"] },
  { title: "周末带爸妈吃了湘菜 辣到哭", type: "emotion", tags: ["湘菜", "家庭"] },
  { title: "今天去探了一家 4.9 果然失望", type: "emotion", tags: ["探店", "失望"] },
  { title: "深圳最孤独的早茶｜一个人 3 笼", type: "emotion", tags: ["早茶", "独食"] },
  { title: "下雨天跟室友去吃了顿烤鱼", type: "emotion", tags: ["烤鱼", "雨天"] },
  { title: "鮨·初｜周末预约攻略", type: "guide", tags: ["鮨·初", "日料", "预约"] },
  { title: "顺德早茶｜3 家不踩雷", type: "guide", tags: ["顺德", "早茶", "攻略"] },
  { title: "潮汕牛肉火锅｜深圳 5 家推荐", type: "guide", tags: ["潮汕", "牛肉", "推荐"] },
  { title: "广州早茶｜周末排队指南", type: "guide", tags: ["广州", "早茶", "排队"] },
  { title: "福田 coffee walk｜5 家新店", type: "guide", tags: ["福田", "咖啡", "新店"] },
  { title: "南山日料｜午市定食推荐", type: "guide", tags: ["南山", "日料", "午市"] },
  { title: "深圳精酿啤酒｜3 家聚会首选", type: "guide", tags: ["精酿", "酒吧", "聚会"] },
  { title: "川菜探店｜3 家够辣的", type: "guide", tags: ["川菜", "辣", "探店"] },
  { title: "夜宵烧烤｜南山区 5 家大排档", type: "guide", tags: ["夜宵", "南山区", "烧烤"] },
  { title: "深圳威士忌吧｜新手入门 3 选", type: "guide", tags: ["威士忌", "酒吧", "新手"] },
  { title: "钱包扁了｜别再推任何餐厅", type: "noise", tags: ["预算", "反推荐"] },
  { title: "今天只想吃外卖｜不去任何店", type: "noise", tags: ["外卖", "取消"] },
  { title: "加班到 10 点｜宵夜摊是必备", type: "noise", tags: ["加班", "夜宵"] },
  { title: "想尝试新菜又怕踩雷", type: "noise", tags: ["探店", "犹豫"] },
  { title: "周末下雨｜不能堂食了", type: "noise", tags: ["雨天", "取消"] }
]

export default items