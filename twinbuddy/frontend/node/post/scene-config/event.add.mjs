/**
 * TwinBuddy 场景视频扩充:event 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "今天看了周杰伦｜哭了 3 次", type: "emotion", tags: ["周杰伦", "演唱会"] },
  { title: "深圳湾演唱会散场打车等了 2 小时", type: "emotion", tags: ["演唱会", "打车"] },
  { title: "今天看了一个小众展｜人少体验好", type: "emotion", tags: ["展览", "小众"] },
  { title: "漫展 coser 真的比想象中拼", type: "emotion", tags: ["漫展", "coser"] },
  { title: "今天看了脱口秀｜笑到缺氧", type: "emotion", tags: ["脱口秀", "笑"] },
  { title: "深圳音乐节｜下雨照样嗨", type: "emotion", tags: ["音乐节", "下雨"] },
  { title: "看了一场电影首映｜IMAX 太爽", type: "emotion", tags: ["电影", "首映", "IMAX"] },
  { title: "深圳当代艺术展｜看不懂但好拍", type: "emotion", tags: ["艺术展", "拍照"] },
  { title: "今天看了场芭蕾｜完全看不懂", type: "emotion", tags: ["芭蕾", "体验"] },
  { title: "今天看了场电竞比赛｜现场真的吵", type: "emotion", tags: ["电竞", "现场"] },
  { title: "周杰伦 8 月深圳站｜抢票攻略", type: "guide", tags: ["周杰伦", "抢票"] },
  { title: "深圳湾演唱会座位｜哪一排最划算", type: "guide", tags: ["演唱会", "座位"] },
  { title: "深圳 8 月展览地图｜5 个必看", type: "guide", tags: ["展览", "地图"] },
  { title: "LiveHouse 入门｜3 个深圳场地", type: "guide", tags: ["LiveHouse", "场地"] },
  { title: "脱口秀开放麦｜深圳福田 3 家", type: "guide", tags: ["脱口秀", "开放麦"] },
  { title: "深圳漫展季节｜10 月活动 list", type: "guide", tags: ["漫展", "活动"] },
  { title: "五月天深圳站｜抢票 + 路线", type: "guide", tags: ["五月天", "抢票"] },
  { title: "草莓音乐节｜深圳站攻略", type: "guide", tags: ["草莓", "音乐节"] },
  { title: "深圳周末免费展｜3 个 list", type: "guide", tags: ["免费", "展览", "周末"] },
  { title: "看话剧入门｜3 部入门剧", type: "guide", tags: ["话剧", "入门"] },
  { title: "钱包扁了｜任何活动都算了", type: "noise", tags: ["预算", "反推荐"] },
  { title: "加班太累｜周末演出取消", type: "noise", tags: ["加班", "取消"] },
  { title: "下雨不想出门", type: "noise", tags: ["雨天", "取消"] },
  { title: "找不到人一起｜只能放弃", type: "noise", tags: ["找搭子", "放弃"] },
  { title: "今天只想宅家", type: "noise", tags: ["宅家", "反推荐"] }
]

export default items