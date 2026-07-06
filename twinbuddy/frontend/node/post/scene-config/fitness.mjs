/**
 * TwinBuddy 场景视频数据：健身 / 运动
 * 依据：PRD1 §9.3 + PRD2 §11
 * 类型：30 UGC 情绪 + 20 训练攻略 + 3 反 AI 干扰
 */
export const items = [
  // 0-29: UGC 情绪型
  { title: '今天跑了 3 公里｜差点死在路上', type: 'emotion', tags: ['跑步', '坚持'] },
  { title: '肩背训练 7 天了｜变化比我想的小', type: 'emotion', tags: ['肩背', '训练'] },
  { title: '深圳湾夜跑｜被风吹成傻子', type: 'emotion', tags: ['夜跑', '深圳湾'] },
  { title: '今天去健身房｜又被私教忽悠了', type: 'emotion', tags: ['健身房', '私教'] },
  { title: '瑜伽第 30 天｜柔韧度真的变了', type: 'emotion', tags: ['瑜伽', '记录'] },
  { title: '今天做了 100 个俯卧撑｜手抖', type: 'emotion', tags: ['俯卧撑', '力量'] },
  { title: '深圳爬山｜梧桐山上去下不来', type: 'emotion', tags: ['爬山', '梧桐山'] },
  { title: '跟朋友约了羽毛球｜被打了 0:21', type: 'emotion', tags: ['羽毛球', '朋友'] },
  { title: '今天跳绳 5000 下｜膝盖疼了', type: 'emotion', tags: ['跳绳', '受伤'] },
  { title: '深圳湾骑行 30 公里｜腿酸到不行', type: 'emotion', tags: ['骑行', '深圳湾'] },
  { title: '今天跟同事去打了篮球｜我防守最菜', type: 'emotion', tags: ['篮球', '同事'] },
  { title: '深圳的健身房真的越来越卷', type: 'emotion', tags: ['健身房', '观察'] },
  { title: '今天做了 30 分钟核心训练｜腰酸', type: 'emotion', tags: ['核心', '训练'] },
  { title: '深圳羽毛球场｜周末订不到', type: 'emotion', tags: ['羽毛球', '场地'] },
  { title: '今天跟室友一起跳帕梅拉｜笑死', type: 'emotion', tags: ['帕梅拉', '室友'] },
  { title: '深圳的瑜伽馆 5 家｜只有 1 家坚持去了', type: 'emotion', tags: ['瑜伽', '测评'] },
  { title: '今天去游泳｜水温太低发抖', type: 'emotion', tags: ['游泳', '冷水'] },
  { title: '深圳 24 小时健身房｜深夜真有人在', type: 'emotion', tags: ['24小时', '深夜'] },
  { title: '今天做了 50 个深蹲｜腿废了', type: 'emotion', tags: ['深蹲', '力量'] },
  { title: '深圳飞盘局｜新手真的会被砸到', type: 'emotion', tags: ['飞盘', '新手'] },
  { title: '今天去爬山｜在山里迷路了 1 小时', type: 'emotion', tags: ['爬山', '迷路'] },
  { title: '深圳健身房免费体验 3 次｜一次都没用', type: 'emotion', tags: ['健身房', '浪费'] },
  { title: '今天跑了 5 公里｜比上次快了 2 分钟', type: 'emotion', tags: ['跑步', '进步'] },
  { title: '深圳的羽毛球搭子比恋爱还难找', type: 'emotion', tags: ['羽毛球', '搭子'] },
  { title: '今天去做了拉伸｜比想象中疼', type: 'emotion', tags: ['拉伸', '疼痛'] },
  { title: '深圳湾跑团｜遇到了一个跑步搭子', type: 'emotion', tags: ['跑团', '搭子'] },
  { title: '今天跟朋友去了攀岩｜手脱皮', type: 'emotion', tags: ['攀岩', '朋友'] },
  { title: '深圳的瑜伽老师越来越卷了', type: 'emotion', tags: ['瑜伽', '观察'] },
  { title: '今天跑步摔了｜膝盖破皮', type: 'emotion', tags: ['跑步', '摔伤'] },
  { title: '深圳的健身房月卡 200 元起｜真的值吗', type: 'emotion', tags: ['健身房', '价格'] },

  // 30-49: 训练攻略型
  { title: '你最近看了很多肩背训练内容，14 天计划给你', type: 'guide', tags: ['肩背', '计划', '14天'] },
  { title: '深圳适合跑步的 5 条路线', type: 'guide', tags: ['跑步', '路线'] },
  { title: '入门力量训练｜每周 3 次 30 分钟', type: 'guide', tags: ['力量', '入门'] },
  { title: '瑜伽入门 7 天 plan｜每个动作 5 分钟', type: 'guide', tags: ['瑜伽', '入门'] },
  { title: '深圳湾夜跑安全指南', type: 'guide', tags: ['夜跑', '安全'] },
  { title: '羽毛球新手 7 天上手计划', type: 'guide', tags: ['羽毛球', '新手'] },
  { title: '深圳羽毛球馆 top 5', type: 'guide', tags: ['羽毛球', '场馆'] },
  { title: '跑步不伤膝盖的 5 个要点', type: 'guide', tags: ['跑步', '膝盖'] },
  { title: '深蹲正确姿势｜避免膝盖受伤', type: 'guide', tags: ['深蹲', '姿势'] },
  { title: '深圳 24 小时健身房地图', type: 'guide', tags: ['24小时', '地图'] },
  { title: '减脂餐 7 天 plan｜不节食', type: 'guide', tags: ['减脂', '餐'] },
  { title: '深圳适合爬山的 5 座山', type: 'guide', tags: ['爬山', '推荐'] },
  { title: '瑜伽 7 天入门｜办公室也能做', type: 'guide', tags: ['瑜伽', '办公室'] },
  { title: '深圳飞盘局报名渠道 5 个', type: 'guide', tags: ['飞盘', '报名'] },
  { title: '俯卧撑 30 天升级计划', type: 'guide', tags: ['俯卧撑', '30天'] },
  { title: '深圳瑜伽馆价格对比', type: 'guide', tags: ['瑜伽', '价格'] },
  { title: '新手攀岩 3 次上手 plan', type: 'guide', tags: ['攀岩', '新手'] },
  { title: '深圳跑步搭子怎么找', type: 'guide', tags: ['跑步', '搭子'] },
  { title: '肩颈 10 分钟放松｜办公室', type: 'guide', tags: ['肩颈', '办公室'] },
  { title: '深圳健身房月卡 vs 次卡｜哪个划算', type: 'guide', tags: ['健身房', '价格'] },

  // 50-52: 反 AI 干扰
  { title: '你最近是不是对健身没兴趣？', type: 'noise', tags: ['降权提示', '疑问式'] },
  { title: '今天加班到 11 点｜只想躺平', type: 'noise', tags: ['低能量', '反推荐'] },
  { title: '运动损伤恢复期｜不想被推训练', type: 'noise', tags: ['损伤', '抑制'] }
]

export default items