/**
 * TwinBuddy 时间感知 (T1)
 * 依据：docs/component-designs.md §5
 *
 * 行动卡标题根据当前时间切换：
 *   11:00-13:00 美食 → 午餐推荐
 *   17:00-20:00 美食 → 晚饭推荐
 *   17:00-20:00 健身 → 傍晚训练
 *   21:00-23:00 美食 → 夜宵推荐
 *   21:00-23:00 学习 → 晚间学习
 *   周末 10:00-12:00 美食 → 早茶
 *   周末 10:00-12:00 健身 → 周末跑步
 */

const SCENE_LABELS = {
  trip: '旅行',
  food: '美食',
  fitness: '健身',
  study: '学习',
  event: '活动',
  shopping: '购物',
}

/**
 * @param {string} scene
 * @param {string} baseTitle
 * @param {Date} [now]
 * @returns {string}
 */
export function timeAwareTitle(scene, baseTitle, now) {
  const d = now || new Date()
  const h = d.getHours()
  const day = d.getDay() // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6

  if (scene === 'food') {
    if (h >= 11 && h < 13) return '你公司楼下 5 家适合一人吃的店'
    if (h >= 13 && h < 17) return '下午茶时间｜3 家评分 4.5+ 咖啡'
    if (h >= 17 && h < 21) return '今晚 7:30 附近 3 家日料'
    if (h >= 21 && h < 23) return '晚上 11 点附近 3 家烧烤'
    if (h >= 23 || h < 3) return '凌晨 1 点还能去的店'
    if (isWeekend && h >= 8 && h < 12) return '周末早茶｜罗湖这 3 家'
  }

  if (scene === 'fitness') {
    if (h >= 6 && h < 9) return '今早 30 分钟晨跑路线'
    if (h >= 17 && h < 20) return '今晚 30 分钟肩背训练'
    if (h >= 20 && h < 23) return '睡前 15 分钟拉伸'
    if (isWeekend && h >= 8 && h < 12) return '周末深圳湾跑步'
  }

  if (scene === 'study') {
    if (h >= 9 && h < 12) return '今早 1 小时深度学习'
    if (h >= 14 && h < 18) return '下午 1 小时学习搭子'
    if (h >= 21 && h < 23) return '今晚 1 小时 AI Agent 学习'
    if (isWeekend && h >= 10 && h < 18) return '周末 3 小时编程'
  }

  if (scene === 'event') {
    if (h >= 17 && h < 22) return '今晚有演出，要不要约人一起？'
    if (isWeekend && h >= 10 && h < 18) return '这个周末 5 个免费展览'
  }

  if (scene === 'shopping') {
    if (h >= 12 && h < 14) return '午休时间｜通勤包 3 款'
    if (h >= 19 && h < 23) return '睡前刷 3 款通勤包'
  }

  return baseTitle
}

/**
 * 友好的时间副标题（用于行动卡头）
 * @param {Date} [now]
 * @returns {string}
 */
export function timeSlotLabel(now) {
  const d = now || new Date()
  const h = d.getHours()
  if (h >= 5 && h < 9) return '早上好'
  if (h >= 9 && h < 12) return '上午'
  if (h >= 12 && h < 14) return '中午'
  if (h >= 14 && h < 18) return '下午'
  if (h >= 18 && h < 22) return '晚上'
  return '深夜'
}

export default {
  timeAwareTitle,
  timeSlotLabel,
  sceneLabels: SCENE_LABELS,
}
