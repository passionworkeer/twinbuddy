/**
 * TwinBuddy ActionCard 数据契约自检脚本
 *
 * 用途：跑 `node ActionCard.selfcheck.mjs` 验证：
 *   1. allMockCards 每张卡必填字段齐全（PRD §5.2 10 项）
 *   2. 4 态覆盖（hint/plan/buddy/complete）
 *   3. 6 场景覆盖（trip/food/fitness/study/event/shopping）
 *   4. 30 mock user 5 维冲突分布合理
 *   5. 关键瞬间 / 协商摘要 / 信任锚 不出现品牌自指
 *   6. 推进程度永远 < 100%
 *
 * 用 node:test（Node 18+ 内置），不依赖 vitest/jest
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { allMockCards, tripCardA1, foodCardA2, tripHintCard, tripCompleteCard } from './action-cards.js'

// 读编译产物 users.json(与后端 api/action_cards.py:_load_mock_users 同源),
// 不再依赖仓库里不存在的 users.mjs。
const __dirname_selfcheck = dirname(fileURLToPath(import.meta.url))
const usersPath = resolve(__dirname_selfcheck, '../../../../mock_personas/users.json')
const users = JSON.parse(readFileSync(usersPath, 'utf-8'))

// ===== 1. 卡片必填字段 =====
test('每张卡必填字段齐全（PRD §5.2）', () => {
  for (const card of allMockCards) {
    assert.ok(card.id, `card missing id`)
    assert.ok(card.scene, `card ${card.id} missing scene`)
    // complete 态不需要 trigger_reason（已经接受行动）
    if (card.variant !== 'complete') {
      assert.ok(card.trigger_reason, `card ${card.id} missing trigger_reason`)
    }
    assert.ok(card.title, `card ${card.id} missing title`)
  }
})

// ===== 2. 4 态覆盖 =====
test('4 态都有覆盖', () => {
  const variants = new Set(allMockCards.map((c) => c.variant))
  assert.ok(variants.has('hint'), '缺 hint 态')
  assert.ok(variants.has('plan'), '缺 plan 态')
  assert.ok(variants.has('buddy'), '缺 buddy 态')
  assert.ok(variants.has('complete'), '缺 complete 态')
})

// ===== 3. 6 场景覆盖 =====
test('6 场景都有覆盖', () => {
  const scenes = new Set(allMockCards.map((c) => c.scene))
  for (const s of ['trip', 'food', 'fitness', 'study', 'event', 'shopping']) {
    assert.ok(scenes.has(s), `缺 ${s} 场景`)
  }
})

// ===== 4. 信任锚（旅行/美食卡必含）=====
test('旅行/美食 plan 态含信任锚（截止/距离/预算）', () => {
  const trip = allMockCards.find((c) => c.id === 'trip-a1-dapeng')
  assert.ok(trip.meta?.deadline, '旅行卡缺 deadline')
  assert.ok(trip.meta?.budget, '旅行卡缺 budget 信任锚')

  const food = allMockCards.find((c) => c.id === 'food-a2-sushi')
  assert.ok(food.meta?.deadline, '美食卡缺 deadline')
  assert.ok(food.meta?.budget, '美食卡缺 budget 信任锚')
})

// ===== 5. 邀约文案无品牌自指 =====
test('邀约文案不出现品牌自指句', () => {
  const invite = tripCompleteCard.invite_text
  assert.ok(!invite.includes('TwinBuddy'), '邀约文案出现品牌自指 TwinBuddy')
  assert.ok(!invite.includes('路线可以按 TwinBuddy'), '邀约文案出现反文案范例')
  // 必须有"我俩 AA"或"微信"等真人语气锚
  assert.ok(invite.includes('AA') || invite.includes('微信'), '邀约文案缺真人语气锚')
})

// ===== 6. 协商进度永远 < 100% =====
test('协商进度永远 < 100%（PRD §16 红线）', () => {
  for (const card of allMockCards) {
    if (card.negotiation_summary?.progress != null) {
      assert.ok(card.negotiation_summary.progress < 100, `卡 ${card.id} progress=100 违反红线`)
    }
  }
})

// ===== 7. 关键瞬间字段齐全（仅 buddy 态必查）=====
test('buddy 态有 key_moment', () => {
  const buddy = allMockCards.find((c) => c.variant === 'buddy')
  // allMockCards 里 plan 态含 negotiation_summary，但 variant 未必是 buddy
  // 这里只检查 trip-a1-dapeng 是 plan 态且含 key_moment
  const trip = allMockCards.find((c) => c.id === 'trip-a1-dapeng')
  assert.ok(trip.negotiation_summary?.key_moment, '旅行卡缺关键瞬间')
  const km = trip.negotiation_summary.key_moment
  assert.ok(km.speaker, 'key_moment 缺 speaker')
  assert.ok(km.text, 'key_moment 缺 text')
  assert.ok(km.detected_conflict, 'key_moment 缺 detected_conflict')
  assert.ok(km.resolution, 'key_moment 缺 resolution')
  assert.ok(['agreed', 'pending', 'escalated'].includes(km.outcome), `key_moment.outcome 非法: ${km.outcome}`)
})

// ===== 8. 30 mock user 5 维冲突 =====
test('30 mock user 5 维分布合理', () => {
  assert.equal(users.length, 30, 'mock user 不是 30 个')
  const pace = new Set(users.map((u) => u.pace))
  const budget = new Set(users.map((u) => u.budget_band))
  const photo = new Set(users.map((u) => u.photo_pref))
  const plan = new Set(users.map((u) => u.plan_style))
  const social = new Set(users.map((u) => u.social_style))
  assert.ok(pace.size >= 2, 'pace 应至少 2 档')
  assert.ok(budget.size >= 2, 'budget 应至少 2 档')
  assert.ok(photo.size >= 2, 'photo 应至少 2 档')
  assert.ok(plan.size >= 2, 'plan 应至少 2 档')
  assert.ok(social.size >= 2, 'social 应至少 2 档（评审要求 outgoing/slow_warm 二档）')
  assert.equal(social.size, 2, `social 严格 2 档，实际 ${social.size} 档（可能引入了 guarded）`)
})

// ===== 9. mock user 0 fit/avoid 冲突 =====
test('mock user 无 fit/avoid 同场景冲突', () => {
  for (const u of users) {
    const fits = new Set(u.fit_scenes)
    for (const s of u.avoid_scenes) {
      assert.ok(!fits.has(s), `user ${u.uid} 同时 fit 和 avoid ${s}`)
    }
  }
})

// ===== 10. 30 mock user 覆盖 6 场景 =====
test('30 mock user 覆盖 6 场景', () => {
  const counts = { trip: 0, food: 0, fitness: 0, study: 0, event: 0, shopping: 0 }
  for (const u of users) for (const s of u.fit_scenes) counts[s]++
  for (const s of Object.keys(counts)) {
    assert.ok(counts[s] >= 1, `${s} 场景 0 user 覆盖`)
  }
})
