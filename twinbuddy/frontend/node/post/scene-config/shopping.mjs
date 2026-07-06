/**
 * TwinBuddy 场景视频数据：购物 / 穿搭 / 数码
 * 依据：PRD1 §9.6 + PRD2 §15
 * 注：商业化评分仅 3 分（购物是抖音强项，本场景只做卡片形态）
 */
export const items = [
  // 0-29: UGC 情绪型
  { title: '今天买了一双跑鞋｜测评', type: 'emotion', tags: ['跑鞋', '测评'] },
  { title: '通勤背包｜我买了第 4 个才满意', type: 'emotion', tags: ['背包', '通勤'] },
  { title: '今天买了个键盘｜声音太吵', type: 'emotion', tags: ['键盘', '声音'] },
  { title: '深圳数码店｜华强北永远有新货', type: 'emotion', tags: ['数码', '华强北'] },
  { title: '今天买了一件卫衣｜穿两次起球', type: 'emotion', tags: ['卫衣', '质量'] },
  { title: '通勤穿搭｜每天纠结 15 分钟', type: 'emotion', tags: ['穿搭', '通勤'] },
  { title: '今天买了个显示器｜护眼真的有用', type: 'emotion', tags: ['显示器', '护眼'] },
  { title: '深圳的买手店｜5 家推荐', type: 'emotion', tags: ['买手店', '深圳'] },
  { title: '今天买了条牛仔裤｜试穿比看起来好', type: 'emotion', tags: ['牛仔裤', '试穿'] },
  { title: '通勤手表｜500 元到 5000 元对比', type: 'emotion', tags: ['手表', '对比'] },
  { title: '今天买了个降噪耳机｜地铁必备', type: 'emotion', tags: ['耳机', '降噪'] },
  { title: '深圳的家居店｜宜家 + 本地', type: 'emotion', tags: ['家居', '深圳'] },
  { title: '今天买了支钢笔｜写字变慢但开心', type: 'emotion', tags: ['钢笔', '文具'] },
  { title: '深圳周末逛街｜万象天地', type: 'emotion', tags: ['万象天地', '逛街'] },
  { title: '今天买了双帆布鞋｜搭配神器', type: 'emotion', tags: ['帆布鞋', '搭配'] },
  { title: '通勤包｜电脑包还是双肩包', type: 'emotion', tags: ['通勤', '包'] },
  { title: '今天买了个鼠标｜手感比想象中重要', type: 'emotion', tags: ['鼠标', '手感'] },
  { title: '深圳的 vintage 店｜5 家', type: 'emotion', tags: ['vintage', '深圳'] },
  { title: '今天买了件冲锋衣｜深圳用不上', type: 'emotion', tags: ['冲锋衣', '后悔'] },
  { title: '数码产品｜2026 我的 to-buy list', type: 'emotion', tags: ['to-buy', '数码'] },
  { title: '今天买了个保温杯｜冬天才用得上', type: 'emotion', tags: ['保温杯', '季节'] },
  { title: '深圳的买手集合店｜3 家', type: 'emotion', tags: ['买手店', '推荐'] },
  { title: '今天买了套西装｜面试专用', type: 'emotion', tags: ['西装', '面试'] },
  { title: '通勤饰品｜手表 + 戒指 + 包', type: 'emotion', tags: ['饰品', '通勤'] },
  { title: '深圳的家居｜性价比 5 家', type: 'emotion', tags: ['家居', '性价比'] },
  { title: '今天买了个充电宝｜1 万毫安够用', type: 'emotion', tags: ['充电宝', '数码'] },
  { title: '通勤穿搭｜一周 7 天不重样', type: 'emotion', tags: ['穿搭', '7天'] },
  { title: '深圳的眼镜店｜配镜 500 元起', type: 'emotion', tags: ['眼镜', '配镜'] },
  { title: '今天买了支口红｜颜色根本不像', type: 'emotion', tags: ['口红', '色差'] },
  { title: '数码配件｜键盘 + 鼠标 + 显示器', type: 'emotion', tags: ['配件', '桌面'] },

  // 30-49: 决策攻略型（购物 PRD 强调"决策验证后跳转第三方"）
  { title: '你最近在看通勤背包，按预算帮你筛了 3 个', type: 'guide', tags: ['背包', '筛选', '3个'] },
  { title: '通勤包 3 款｜按预算分档', type: 'guide', tags: ['通勤', '分档'] },
  { title: '跑鞋选购指南｜按脚型', type: 'guide', tags: ['跑鞋', '脚型'] },
  { title: '降噪耳机 top 5｜2026', type: 'guide', tags: ['耳机', '2026'] },
  { title: '深圳买笔记本电脑｜3 家实体店', type: 'guide', tags: ['笔记本', '实体'] },
  { title: '通勤手表 5 款｜500-5000 元', type: 'guide', tags: ['手表', '分档'] },
  { title: '深圳买家具｜宜家 vs 本地', type: 'guide', tags: ['家具', '对比'] },
  { title: '数码产品 2026 趋势｜5 个', type: 'guide', tags: ['趋势', '2026'] },
  { title: '通勤穿搭｜基础款 10 件', type: 'guide', tags: ['基础款', '通勤'] },
  { title: '深圳配眼镜 3 家｜性价比', type: 'guide', tags: ['眼镜', '性价比'] },
  { title: '充电宝选购｜3 个要点', type: 'guide', tags: ['充电宝', '要点'] },
  { title: '深圳买数码｜华强北 5 个推荐', type: 'guide', tags: ['华强北', '推荐'] },
  { title: '西装选购指南｜3 个预算档', type: 'guide', tags: ['西装', '预算'] },
  { title: '数码配件｜桌面 5 件套', type: 'guide', tags: ['桌面', '5件'] },
  { title: '通勤包选购｜5 个要点', type: 'guide', tags: ['通勤', '要点'] },
  { title: '深圳周末逛街地图｜5 个商圈', type: 'guide', tags: ['商圈', '地图'] },
  { title: '手机壳选购｜3 类推荐', type: 'guide', tags: ['手机壳', '推荐'] },
  { title: '深圳买家居｜3 家本地店', type: 'guide', tags: ['家居', '本地'] },
  { title: '通勤鞋选购｜3 类场景', type: 'guide', tags: ['鞋', '场景'] },
  { title: '数码 2026 趋势｜AI 硬件', type: 'guide', tags: ['AI 硬件', '趋势'] },

  // 50-52: 反 AI 干扰
  { title: '你最近是不是对购物没兴趣？', type: 'noise', tags: ['降权提示', '疑问式'] },
  { title: '今天只想白嫖｜不想被推购物', type: 'noise', tags: ['低能量', '抑制'] },
  { title: '钱包扁了｜别再推购物', type: 'noise', tags: ['预算', '反推荐'] }
]

export default items