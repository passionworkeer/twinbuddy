/**
 * TwinBuddy 行动卡降权机制 (D1)
 * 依据：docs/component-designs.md §4
 *
 * 触发：
 *   - 行动卡被用户连续 3 次划走（不点击）
 *   - 用户点过"抑制此类"
 *   - 用户点过"换 3 次搭子"
 *
 * 行为：
 *   第 1 次不点 → 卡片保持不变，触发原因文案软化
 *   第 2 次不点 → 下次标题改为疑问式
 *   第 3 次不点 → 本场景行动卡冻结 24 小时
 *
 * 存储：localStorage v2.dampen.<scene>
 */

const STORAGE_KEY_PREFIX = 'v2.dampen.'
const FREEZE_HOURS = 24

/**
 * @typedef {Object} DampenState
 * @property {string} scene
 * @property {number} skip_count       // 0-3
 * @property {string} last_seen         // ISO8601
 * @property {string} [last_dampened]   // ISO8601
 * @property {string} [expiry]          // ISO8601，24h 之后
 */

function readState(scene) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + scene)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeState(scene, state) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + scene, JSON.stringify(state))
  } catch {
    // ignore
  }
}

/**
 * 检查场景是否被冻结
 * @param {string} scene
 * @returns {boolean}
 */
export function isDampened(scene) {
  const state = readState(scene)
  if (!state || !state.expiry) return false
  return new Date(state.expiry).getTime() > Date.now()
}

/**
 * 记录一次"用户不点"事件
 * @param {string} scene
 * @returns {DampenState} 更新后的状态
 */
export function recordSkip(scene) {
  const prev = readState(scene) || {
    scene,
    skip_count: 0,
    last_seen: new Date().toISOString(),
  }
  const next = {
    ...prev,
    skip_count: (prev.skip_count || 0) + 1,
    last_seen: new Date().toISOString(),
  }
  if (next.skip_count >= 3) {
    const expiry = new Date(Date.now() + FREEZE_HOURS * 3600 * 1000)
    next.last_dampened = new Date().toISOString()
    next.expiry = expiry.toISOString()
  }
  writeState(scene, next)
  return next
}

/**
 * 用户主动"抑制此类"
 * @param {string} scene
 */
export function dampenNow(scene) {
  const expiry = new Date(Date.now() + FREEZE_HOURS * 3600 * 1000)
  const state = {
    scene,
    skip_count: 3,
    last_seen: new Date().toISOString(),
    last_dampened: new Date().toISOString(),
    expiry: expiry.toISOString(),
  }
  writeState(scene, state)
  return state
}

/**
 * 清除场景降权状态（用户重新开启）
 * @param {string} scene
 */
export function clearDampen(scene) {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + scene)
  } catch {
    // ignore
  }
}

/**
 * 根据状态调整行动卡标题/触发原因
 * @param {string} baseTitle
 * @param {string} baseTrigger
 * @param {DampenState} state
 * @returns {{ title: string, trigger_reason: string }}
 */
export function softenByDampen(baseTitle, baseTrigger, state) {
  if (!state) return { title: baseTitle, trigger_reason: baseTrigger }
  if (state.skip_count >= 2) {
    // 疑问式 + 软化
    return {
      title: `你最近是不是对${baseTitle.replace(/^你最近/, '')}没兴趣？`,
      trigger_reason: '随时可以跳过',
    }
  }
  if (state.skip_count >= 1) {
    // 软化触发原因
    return {
      title: baseTitle,
      trigger_reason: baseTrigger.replace(/基于你最近|基于/gi, '可能'),
    }
  }
  return { title: baseTitle, trigger_reason: baseTrigger }
}

export default {
  isDampened,
  recordSkip,
  dampenNow,
  clearDampen,
  softenByDampen,
}
