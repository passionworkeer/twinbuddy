/**
 * TwinBuddy 场景视频数据：普通干扰内容
 * 依据：PRD1 §18.7 + PM 评审"干扰项必须够多"
 *
 * 这部分不进任何行动卡触发，纯 Feed 沉浸感。
 */
export const items = [
  // 0-29: 搞笑 / 生活 / 情绪 / 宠物
  { title: '今天加班到 12 点｜回家路上看到一只流浪猫', type: 'noise', tags: ['加班', '流浪猫'] },
  { title: '深圳的早晨｜地铁里的人都面无表情', type: 'noise', tags: ['地铁', '早晨'] },
  { title: '今天做了个饭｜卖相差但味道行', type: 'noise', tags: ['做饭', '日常'] },
  { title: '凌晨 1 点还在写代码｜写不动了', type: 'noise', tags: ['程序员', '加班'] },
  { title: '今天去超市看到打折｜买了 5 包薯片', type: 'noise', tags: ['超市', '日常'] },
  { title: '深圳的天气｜一周四季随机切换', type: 'noise', tags: ['天气', '吐槽'] },
  { title: '今天养的猫又把我的杯子打碎了', type: 'noise', tags: ['宠物', '猫'] },
  { title: '周末去公园｜看到一家三口在放风筝', type: 'noise', tags: ['公园', '家庭'] },
  { title: '今天去银行排队等了 2 小时', type: 'noise', tags: ['银行', '排队'] },
  { title: '深圳的便利店｜24 小时救我命', type: 'noise', tags: ['便利店', '城市'] },
  { title: '今天养的狗把家拆了', type: 'noise', tags: ['宠物', '狗'] },
  { title: '凌晨 3 点还在刷手机｜眼睛疼', type: 'noise', tags: ['刷手机', '熬夜'] },
  { title: '深圳的地铁里情侣最多', type: 'noise', tags: ['地铁', '观察'] },
  { title: '今天做了个饭团｜歪七扭八', type: 'noise', tags: ['做饭', '日常'] },
  { title: '今天加班到凌晨｜回家路上吃了一碗面', type: 'noise', tags: ['加班', '夜宵'] },
  { title: '深圳周末｜到处都是人', type: 'noise', tags: ['周末', '人'] },
  { title: '今天去看了场免费展｜人多到爆炸', type: 'noise', tags: ['免费展', '人'] },
  { title: '今天养的仓鼠又越狱了', type: 'noise', tags: ['宠物', '仓鼠'] },
  { title: '深圳的咖啡店｜周末没位置', type: 'noise', tags: ['咖啡', '周末'] },
  { title: '今天去参加了朋友的婚礼｜哭成狗', type: 'noise', tags: ['婚礼', '朋友'] },
  { title: '深圳的公园｜早上去的都是老人', type: 'noise', tags: ['公园', '观察'] },
  { title: '今天去做了个头发｜不满意', type: 'noise', tags: ['头发', '理发'] },
  { title: '深圳的图书馆｜安静到窒息', type: 'noise', tags: ['图书馆', '安静'] },
  { title: '今天养的乌龟晒太阳', type: 'noise', tags: ['宠物', '乌龟'] },
  { title: '今天去吃了顿自助｜回本失败', type: 'noise', tags: ['自助', '回本'] },
  { title: '深圳的商场｜周末停车太难', type: 'noise', tags: ['商场', '停车'] },
  { title: '今天被甲方折磨了一天', type: 'noise', tags: ['工作', '甲方'] },
  { title: '今天去看了场免费相声｜笑死', type: 'noise', tags: ['相声', '免费'] },
  { title: '深圳的地铁 1 号线｜早高峰最挤', type: 'noise', tags: ['地铁', '早高峰'] },
  { title: '今天养的猫在键盘上睡着了', type: 'noise', tags: ['宠物', '猫'] },

  // 30-49: 热门话题 / 情绪文案
  { title: '今天又被老板骂了｜想辞职', type: 'noise', tags: ['工作', '辞职'] },
  { title: '深圳打工人的一天｜6 点起床 11 点到家', type: 'noise', tags: ['打工人', '深圳'] },
  { title: '今天看了个老电影｜哭成狗', type: 'noise', tags: ['电影', '感动'] },
  { title: '深圳的物价｜一碗面 35 元', type: 'noise', tags: ['物价', '吐槽'] },
  { title: '今天回家被妈妈念叨了 3 小时', type: 'noise', tags: ['家庭', '妈妈'] },
  { title: '深圳的便利店咖啡｜救了我', type: 'noise', tags: ['咖啡', '便利店'] },
  { title: '今天加班到凌晨｜打车费 80 元', type: 'noise', tags: ['加班', '打车'] },
  { title: '深圳的周末｜只想宅家', type: 'noise', tags: ['周末', '宅'] },
  { title: '今天去看了场免费球赛｜精彩', type: 'noise', tags: ['球赛', '免费'] },
  { title: '深圳的天气｜今天又下雨了', type: 'noise', tags: ['天气', '雨'] },
  { title: '今天被同事背叛了｜想哭', type: 'noise', tags: ['工作', '同事'] },
  { title: '深圳的早餐｜包子 3 元一个', type: 'noise', tags: ['早餐', '价格'] },
  { title: '今天去做了个志愿者｜有意义', type: 'noise', tags: ['志愿者', '有意义'] },
  { title: '深圳的地铁｜空调太冷', type: 'noise', tags: ['地铁', '空调'] },
  { title: '今天养的猫生病了｜担心', type: 'noise', tags: ['宠物', '猫'] },
  { title: '深圳的咖啡店｜带电脑工作最划算', type: 'noise', tags: ['咖啡', '工作'] },
  { title: '今天加班到凌晨｜回家路上看到月亮', type: 'noise', tags: ['加班', '月亮'] },
  { title: '深圳的周末｜南山最堵', type: 'noise', tags: ['周末', '堵车'] },
  { title: '今天去看了场免费画展｜有意思', type: 'noise', tags: ['画展', '免费'] },
  { title: '深圳的便利店｜饭团 8 元', type: 'noise', tags: ['便利店', '饭团'] },

  // 50-52: 反 AI 干扰（保持一致降权触发）
  { title: '今天没心情看任何东西', type: 'noise', tags: ['低能量', '抑制'] },
  { title: '我想自己决定看什么｜不要推', type: 'noise', tags: ['自主', '抑制'] },
  { title: '把行动卡关了吧｜刷不出好东西', type: 'noise', tags: ['关闭', '抑制'] }
]

export default items