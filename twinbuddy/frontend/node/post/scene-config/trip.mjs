/**
 * TwinBuddy 场景视频数据：旅行 / 周边游
 * 依据：PRD1 §9.1 + PRD2 §9 + PM 评审（30 UGC + 20 攻略 + 3 反 AI 干扰）
 *
 * 字段类型：
 *   - emotion: UGC 情绪型（随手拍、吐槽、情绪反差）
 *   - guide:   攻略型（路线、预算、拍照点）
 *   - noise:   反 AI 干扰（加班、雨天、低能量）
 */
export const items = [
  // 0-29: UGC 情绪型（30 条，PM 评审要求"看起来像抖音"）
  { title: '刚从大鹏回来，被这日落闪到了', type: 'emotion', tags: ['大鹏', '日落', '随手拍'] },
  { title: '深圳湾等日落的第三个小时，没等到', type: 'emotion', tags: ['深圳湾', '日落', '等待'] },
  { title: '深圳的雨真的下够了', type: 'emotion', tags: ['天气', '吐槽'] },
  { title: '今天加班到 12 点，但还是想吃日料', type: 'emotion', tags: ['加班', '情绪'] },
  { title: '今天跟同事吵了一架，想一个人 citywalk', type: 'emotion', tags: ['情绪', 'citywalk'] },
  { title: '凌晨两点突然想吃烧烤', type: 'emotion', tags: ['夜宵', '情绪'] },
  { title: '一个人去了较场尾，发现也没那么孤独', type: 'emotion', tags: ['较场尾', '独旅'] },
  { title: '刚从惠州回来，三天胖了两斤', type: 'emotion', tags: ['惠州', '美食', '回来'] },
  { title: '深圳的春天来了但好像又没有', type: 'emotion', tags: ['天气', '情绪'] },
  { title: '周末本来想躺平，结果被朋友拉去爬山', type: 'emotion', tags: ['周末', '朋友', '意外'] },
  { title: '阳台山的雾大到我以为成仙了', type: 'emotion', tags: ['阳台山', '雾', '随手拍'] },
  { title: '深圳的地铁 11 号线也太长了吧', type: 'emotion', tags: ['地铁', '吐槽'] },
  { title: '凌晨 4 点深圳湾的风有点冷', type: 'emotion', tags: ['深圳湾', '凌晨'] },
  { title: '从化温泉回来皮肤滑了 3 天', type: 'emotion', tags: ['从化', '温泉', '体验'] },
  { title: '跟室友去了顺德，一天吃了 5 顿', type: 'emotion', tags: ['顺德', '室友', '吃'] },
  { title: '本来想爬梧桐山，结果在下雨', type: 'emotion', tags: ['梧桐山', '雨天'] },
  { title: '深圳湾骑行的风把我发型吹没了', type: 'emotion', tags: ['骑行', '深圳湾'] },
  { title: '莲花山的相亲角比公园还热闹', type: 'emotion', tags: ['莲花山', '观察'] },
  { title: '从深圳到厦门的高铁上看到了 3 次日落', type: 'emotion', tags: ['高铁', '厦门', '日落'] },
  { title: '周日早上 9 点公园只有 3 个人', type: 'emotion', tags: ['公园', '周日'] },
  { title: '看到海的那一瞬间突然什么都不想说了', type: 'emotion', tags: ['海', '情绪'] },
  { title: '深圳咖啡店地图｜已经探到第 67 家', type: 'emotion', tags: ['咖啡', '探店'] },
  { title: '加班完去宵夜摊发现老板记得我的口味', type: 'emotion', tags: ['夜宵', '老板'] },
  { title: '跟朋友 citywalk 居然走了 3 万步', type: 'emotion', tags: ['citywalk', '朋友'] },
  { title: '深圳的便利店 24 小时不关门是真的', type: 'emotion', tags: ['便利店', '城市'] },
  { title: '从大鹏回来发了 200 张照片只敢发 9 张', type: 'emotion', tags: ['拍照', '大鹏'] },
  { title: '凌晨 1 点的深圳还是有人跑步', type: 'emotion', tags: ['夜跑', '城市'] },
  { title: '在较场尾遇到了 3 个大学生在弹吉他', type: 'emotion', tags: ['较场尾', '街头艺人'] },
  { title: '深圳夏天来得比想象中早', type: 'emotion', tags: ['夏天', '吐槽'] },
  { title: '每次去南澳都觉得值回票价', type: 'emotion', tags: ['南澳', '海滩'] },

  // 30-49: 攻略型（20 条，沿用 PRD §10.6 调性）
  { title: '深圳周末不用早起的海边路线', type: 'guide', tags: ['深圳', '周末游', '海边'] },
  { title: '大鹏半日游｜拍照 + 散步 + 咖啡', type: 'guide', tags: ['大鹏', '半日游', '拍照'] },
  { title: '一个人也能去，但两个人更好玩的 citywalk', type: 'guide', tags: ['citywalk', '深圳', '慢节奏'] },
  { title: '大鹏较场尾｜下午 3 点最舒服', type: 'guide', tags: ['较场尾', '下午茶'] },
  { title: '大鹏所城周末拍照路线', type: 'guide', tags: ['大鹏所城', '古风', '拍照'] },
  { title: '从市区到大鹏｜不堵车路线', type: 'guide', tags: ['攻略', '交通'] },
  { title: '南澳第一沙滩｜不需要早起', type: 'guide', tags: ['南澳', '沙滩'] },
  { title: '深圳天文台预约攻略', type: 'guide', tags: ['天文台', '徒步'] },
  { title: '东西冲穿越｜新手徒步路线', type: 'guide', tags: ['东西冲', '徒步'] },
  { title: '深圳小众海边：金沙湾', type: 'guide', tags: ['金沙湾', '小众'] },
  { title: '华强北 coffee walk｜3 家独立咖啡', type: 'guide', tags: ['citywalk', '咖啡', '华强北'] },
  { title: '蛇口老街一日 walk', type: 'guide', tags: ['蛇口', 'citywalk', '老街'] },
  { title: '华侨城创意园 walk', type: 'guide', tags: ['华侨城', '文创'] },
  { title: '南头古城半天 plan', type: 'guide', tags: ['南头古城', '文创', '半天'] },
  { title: '打卡深圳湾公园日落', type: 'guide', tags: ['深圳湾', '日落', '公园'] },
  { title: '深圳露营推荐 3 个场地', type: 'guide', tags: ['露营', '深圳'] },
  { title: '惠州双月湾周末游', type: 'guide', tags: ['惠州', '双月湾', '周末'] },
  { title: '从化温泉一日游攻略', type: 'guide', tags: ['从化', '温泉', '一日'] },
  { title: '广州沙面 island walk', type: 'guide', tags: ['广州', '沙面', 'citywalk'] },
  { title: '顺德美食 + 周末短途', type: 'guide', tags: ['顺德', '美食', '短途'] },

  // 50-52: 反 AI 干扰（3 条，故意放低能量/反意图/降权触发）
  { title: '加班到 12 点｜不想被推周末出逃', type: 'noise', tags: ['加班', '反推荐'] },
  { title: '今天只想躺平｜关闭行动卡推荐', type: 'noise', tags: ['躺平', '抑制'] },
  { title: '钱包扁了｜别再推任何旅行', type: 'noise', tags: ['预算', '反推荐'] }
]

export default items