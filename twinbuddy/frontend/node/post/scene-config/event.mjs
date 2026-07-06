/**
 * TwinBuddy 场景视频数据：演唱会 / 展览 / 活动
 * 依据：PRD1 §9.5 + PRD2 §13 + 商业化第二引擎
 */
export const items = [
  // 0-29: UGC 情绪型
  { title: '今天去看了周杰伦演唱会｜哭了 3 次', type: 'emotion', tags: ['演唱会', '周杰伦'] },
  { title: '深圳湾演唱会｜散场打车等了 2 小时', type: 'emotion', tags: ['演唱会', '打车'] },
  { title: '今天去看了一个小众展｜人少体验好', type: 'emotion', tags: ['展览', '小众'] },
  { title: '漫展 coser 真的比想象中拼', type: 'emotion', tags: ['漫展', 'coser'] },
  { title: '今天去看了一场脱口秀｜笑到缺氧', type: 'emotion', tags: ['脱口秀', '笑'] },
  { title: '深圳的音乐节｜下雨照样嗨', type: 'emotion', tags: ['音乐节', '深圳'] },
  { title: '今天去看了一场电影首映｜IMAX 太爽', type: 'emotion', tags: ['电影', '首映'] },
  { title: '深圳当代艺术展｜看不懂但好拍', type: 'emotion', tags: ['艺术展', '拍照'] },
  { title: '今天去看了一场电竞比赛｜现场真的吵', type: 'emotion', tags: ['电竞', '现场'] },
  { title: '演唱会座位 18 排｜后悔没买近的', type: 'emotion', tags: ['演唱会', '座位'] },
  { title: '深圳周末展览地图｜5 个推荐', type: 'emotion', tags: ['展览', '地图'] },
  { title: '今天去看了一场 livehouse｜耳朵聋了', type: 'emotion', tags: ['livehouse', '现场'] },
  { title: '深圳的演唱会抢票真的卷', type: 'emotion', tags: ['演唱会', '抢票'] },
  { title: '今天去了一个艺术展｜门票 80 元', type: 'emotion', tags: ['艺术展', '门票'] },
  { title: '跟朋友约了展览｜结果走散了', type: 'emotion', tags: ['展览', '走散'] },
  { title: '今天去看了一场脱口秀｜被 call 到', type: 'emotion', tags: ['脱口秀', 'call'] },
  { title: '深圳的漫展｜停车比逛展还累', type: 'emotion', tags: ['漫展', '停车'] },
  { title: '今天去看了一场芭蕾｜完全看不懂', type: 'emotion', tags: ['芭蕾', '体验'] },
  { title: '演唱会散场｜地铁排队 1 小时', type: 'emotion', tags: ['演唱会', '地铁'] },
  { title: '深圳周末活动地图｜10 个', type: 'emotion', tags: ['活动', '地图'] },
  { title: '今天去看了一场乐队演出｜音响太炸', type: 'emotion', tags: ['乐队', '音响'] },
  { title: '深圳的展览｜周一周二人最少', type: 'emotion', tags: ['展览', '工作日'] },
  { title: '今天去看了一场话剧｜眼泪止不住', type: 'emotion', tags: ['话剧', '感动'] },
  { title: '演唱会门票被黄牛炒到 3 倍', type: 'emotion', tags: ['演唱会', '黄牛'] },
  { title: '深圳音乐厅｜周末场次最快售罄', type: 'emotion', tags: ['音乐厅', '周末'] },
  { title: '今天去看了一场儿童剧｜被萌到', type: 'emotion', tags: ['儿童剧', '萌'] },
  { title: '深圳的线下脱口秀｜晚上 9 点场最好', type: 'emotion', tags: ['脱口秀', '晚上'] },
  { title: '今天去看了一场交响乐｜差点睡着', type: 'emotion', tags: ['交响乐', '困'] },
  { title: '演唱会结束跟陌生人拼车回市区', type: 'emotion', tags: ['演唱会', '拼车'] },
  { title: '深圳当代艺术展｜文创比展品好', type: 'emotion', tags: ['艺术展', '文创'] },

  // 30-49: 活动攻略型
  { title: '这周末周杰伦演唱会深圳站｜同城同行人', type: 'guide', tags: ['周杰伦', '同城', '同行'] },
  { title: '深圳 8 月演唱会日历', type: 'guide', tags: ['演唱会', '日历'] },
  { title: '深圳当代艺术展 top 5', type: 'guide', tags: ['艺术展', 'top5'] },
  { title: '深圳漫展报名渠道 5 个', type: 'guide', tags: ['漫展', '报名'] },
  { title: '深圳脱口秀 5 家｜笑果文化', type: 'guide', tags: ['脱口秀', '笑果'] },
  { title: '深圳 livehouse 5 家｜推荐', type: 'guide', tags: ['livehouse', '推荐'] },
  { title: '演唱会抢票攻略｜大麦', type: 'guide', tags: ['抢票', '大麦'] },
  { title: '深圳周末展览 5 个｜免费', type: 'guide', tags: ['展览', '免费'] },
  { title: '深圳音乐节 3 个｜夏季', type: 'guide', tags: ['音乐节', '夏季'] },
  { title: '深圳话剧 5 部｜近期', type: 'guide', tags: ['话剧', '近期'] },
  { title: '演唱会座位选择｜哪个区最值', type: 'guide', tags: ['座位', '选区'] },
  { title: '深圳博物馆 5 个｜周末', type: 'guide', tags: ['博物馆', '周末'] },
  { title: '深圳的乐队演出｜5 个场地', type: 'guide', tags: ['乐队', '场地'] },
  { title: '展览拍照 5 个技巧', type: 'guide', tags: ['展览', '拍照'] },
  { title: '深圳 8 月活动日历', type: 'guide', tags: ['活动', '8月'] },
  { title: '深圳儿童剧 5 部｜适合家庭', type: 'guide', tags: ['儿童剧', '家庭'] },
  { title: '深圳芭蕾舞 3 部｜近期', type: 'guide', tags: ['芭蕾', '近期'] },
  { title: '深圳交响乐 5 场｜近期', type: 'guide', tags: ['交响乐', '近期'] },
  { title: '演唱会同行人 5 个渠道', type: 'guide', tags: ['同行人', '搭子'] },
  { title: '深圳的文创展览 5 个', type: 'guide', tags: ['文创', '展览'] },

  // 50-52: 反 AI 干扰
  { title: '你最近是不是对演唱会没兴趣？', type: 'noise', tags: ['降权提示', '疑问式'] },
  { title: '今天只想宅家｜不想被推活动', type: 'noise', tags: ['低能量', '抑制'] },
  { title: '加班到深夜｜根本不想出门', type: 'noise', tags: ['加班', '反推荐'] }
]

export default items