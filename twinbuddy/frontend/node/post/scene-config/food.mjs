/**
 * TwinBuddy 场景视频数据：美食 / 探店
 * 依据：PRD1 §9.2 + PRD2 §10 + PM 评审（半深闭环，第二 demo）
 * 类型：30 UGC 情绪 + 20 决策攻略 + 3 反 AI 干扰
 */
export const items = [
  // 0-29: UGC 情绪型
  { title: '凌晨两点在福田找到一家凌晨火锅店', type: 'emotion', tags: ['夜宵', '福田'] },
  { title: '今天跟朋友去吃了潮汕牛肉火锅', type: 'emotion', tags: ['火锅', '朋友'] },
  { title: '深圳第一顿早茶｜必点虾饺', type: 'emotion', tags: ['早茶', '广州菜'] },
  { title: '公司楼下的麻辣烫吃了一年', type: 'emotion', tags: ['工作餐', '麻辣烫'] },
  { title: '今天去了一家小笼包店 阿姨很凶但东西好吃', type: 'emotion', tags: ['小笼包', '阿姨'] },
  { title: '周末带爸妈去了一家湘菜 辣到哭', type: 'emotion', tags: ['湘菜', '家庭'] },
  { title: '凌晨 3 点的烧烤摊才是深圳的灵魂', type: 'emotion', tags: ['烧烤', '夜宵'] },
  { title: '跟同事去吃了顿日料 居然 AA 到小数点', type: 'emotion', tags: ['日料', '同事', 'AA'] },
  { title: '在深圳第一次吃到妈妈的味道', type: 'emotion', tags: ['家乡菜', '感动'] },
  { title: '下雨天跟室友去吃了顿烤鱼', type: 'emotion', tags: ['烤鱼', '雨天'] },
  { title: '深圳最孤独的早茶｜一个人 3 笼', type: 'emotion', tags: ['早茶', '独食'] },
  { title: '今天去探了一家评分 4.9 的店 果然失望', type: 'emotion', tags: ['探店', '失望'] },
  { title: '深业上城那家川菜｜辣到嘴肿', type: 'emotion', tags: ['川菜', '探店'] },
  { title: '深圳的云南菜越来越少正宗的了', type: 'emotion', tags: ['云南菜', '吐槽'] },
  { title: '今天跟闺蜜去吃了顿泰式火锅', type: 'emotion', tags: ['泰式', '闺蜜'] },
  { title: '凌晨 5 点的早餐店已经开门了', type: 'emotion', tags: ['早餐', '凌晨'] },
  { title: '深圳咖啡店 5 家新开的 3 家踩雷', type: 'emotion', tags: ['咖啡', '新店'] },
  { title: '今天去吃了一顿韩国烤肉 五花肉太香了', type: 'emotion', tags: ['烤肉', '韩国'] },
  { title: '深圳的小龙虾旺季来了', type: 'emotion', tags: ['小龙虾', '季节'] },
  { title: '今天加班餐｜公司请客结果还是工作餐', type: 'emotion', tags: ['加班', '吐槽'] },
  { title: '周末去了一家私房菜 要提前 3 天订', type: 'emotion', tags: ['私房菜', '预约'] },
  { title: '深圳 6 家米线｜只有 2 家值得再去', type: 'emotion', tags: ['米线', '测评'] },
  { title: '潮汕牛肉火锅的正确吃法', type: 'emotion', tags: ['火锅', '科普'] },
  { title: '今天去了一家隐藏在城中村的烧烤店', type: 'emotion', tags: ['城中村', '烧烤'] },
  { title: '深圳最贵的日料｜值不值？', type: 'emotion', tags: ['日料', '测评'] },
  { title: '凌晨 2 点的潮汕砂锅粥救了我', type: 'emotion', tags: ['砂锅粥', '夜宵'] },
  { title: '深圳早茶地图｜我心中的 top 5', type: 'emotion', tags: ['早茶', 'top5'] },
  { title: '今天去吃了顿素食｜居然很满足', type: 'emotion', tags: ['素食', '意外'] },
  { title: '深圳的麻辣香锅店越来越多了', type: 'emotion', tags: ['麻辣香锅', '观察'] },
  { title: '跟同事去吃了一顿螺蛳粉 整个办公室都臭了', type: 'emotion', tags: ['螺蛳粉', '同事'] },

  // 30-49: 决策攻略型（半深场景，文案带信任锚）
  { title: '你最近收藏的 3 家里，鮨·初 今晚 19:30 不用排队', type: 'guide', tags: ['日料', '推荐', '不排队'] },
  { title: '南山 3 家适合周末吃的火锅｜人均 80 元', type: 'guide', tags: ['火锅', '南山', '人均'] },
  { title: '福田 5 家适合一人食的店', type: 'guide', tags: ['一人食', '福田'] },
  { title: '罗湖老街早茶地图｜本地人都知道', type: 'guide', tags: ['早茶', '罗湖'] },
  { title: '深圳 10 家适合约饭搭子的店', type: 'guide', tags: ['饭搭子', '推荐'] },
  { title: '宝安机场附近的深夜食堂｜24 小时', type: 'guide', tags: ['夜宵', '机场'] },
  { title: '深圳 5 家适合商务宴请的餐厅', type: 'guide', tags: ['商务', '宴请'] },
  { title: '潮汕牛肉火锅深圳 top 3', type: 'guide', tags: ['火锅', 'top3'] },
  { title: '深圳川菜地图｜辣度分级', type: 'guide', tags: ['川菜', '地图'] },
  { title: '深圳日料｜5 家不踩雷', type: 'guide', tags: ['日料', '不踩雷'] },
  { title: '深圳本地人爱去的早茶店', type: 'guide', tags: ['早茶', '本地'] },
  { title: '深圳适合带爸妈吃的餐厅 5 家', type: 'guide', tags: ['家庭', '父母'] },
  { title: '深圳 6 家适合约会的餐厅', type: 'guide', tags: ['约会', '推荐'] },
  { title: '深圳性价比 top 10 私房菜', type: 'guide', tags: ['私房菜', '性价比'] },
  { title: '深圳咖啡店 10 家｜适合一人独坐', type: 'guide', tags: ['咖啡', '独坐'] },
  { title: '深圳烧烤店 5 家｜凌晨不打烊', type: 'guide', tags: ['烧烤', '凌晨'] },
  { title: '深圳适合周末聚餐的 8 家大排档', type: 'guide', tags: ['大排档', '聚餐'] },
  { title: '深圳韩国料理 5 家｜正宗度测评', type: 'guide', tags: ['韩国', '测评'] },
  { title: '深圳甜品店 top 8｜适合下午茶', type: 'guide', tags: ['甜品', '下午茶'] },
  { title: '深圳适合生日聚餐的 5 家店', type: 'guide', tags: ['生日', '聚餐'] },

  // 50-52: 反 AI 干扰
  { title: '你最近是不是对日料没兴趣？', type: 'noise', tags: ['降权提示', '疑问式'] },
  { title: '今天只想吃泡面｜不想决策', type: 'noise', tags: ['低能量', '反决策'] },
  { title: '工作日午餐｜最不想被推荐', type: 'noise', tags: ['工作餐', '抑制'] }
]

export default items