#!/usr/bin/env node
/**
 * TwinBuddy 场景视频合并 + 黄金顺序输出
 *
 * 用法：
 *   node merge-and-shuffle.mjs
 *
 * 它把 6 个场景 config + 30 个 mock user 合并成：
 *   - posts.json  : 全量视频（每场景 50+ 条，author 已绑定）
 *   - posts6.json : 首屏 6 条（随机选）
 *   - golden-order.json : 黄金顺序 list（PRD §10.4 8+1+2+1+4+1+1）
 *   - card-triggers.json : 行动卡插入位置（黄金顺序里的 card slot）
 *
 * 输出文件：twinbuddy/frontend/node/post/data/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { items as tripItems } from './scene-config/trip.mjs'
import { items as foodItems } from './scene-config/food.mjs'
import { items as fitnessItems } from './scene-config/fitness.mjs'
import { items as studyItems } from './scene-config/study.mjs'
import { items as eventItems } from './scene-config/event.mjs'
import { items as shoppingItems } from './scene-config/shopping.mjs'
import { items as noiseItems } from './scene-config/noise.mjs'

import { generateSceneFeed } from './make-scene-data.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读编译产物 users.json(与后端 api/action_cards.py:_load_mock_users 同源),
// 不再依赖仓库里不存在的 users.mjs。
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..')
const users = JSON.parse(fs.readFileSync(path.join(repoRoot, 'mock_personas', 'users.json'), 'utf-8'))

const SCENES = [
  { id: 'trip', items: tripItems },
  { id: 'food', items: foodItems },
  { id: 'fitness', items: fitnessItems },
  { id: 'study', items: studyItems },
  { id: 'event', items: eventItems },
  { id: 'shopping', items: shoppingItems },
  { id: 'noise', items: noiseItems },
]

// 黄金顺序：依据 PRD §10.4
const GOLDEN_ORDER = [
  { type: 'video', scene: 'noise', count: 8 },     // 8 普通（先 noise 沉浸）
  { type: 'card', cardId: 'trip-hint-1' },         // 轻提示
  { type: 'video', scene: 'trip', count: 2 },      // 2 旅行
  { type: 'card', cardId: 'trip-a1-dapeng' },      // 旅行行动卡
  { type: 'video', scene: 'noise', count: 2 },     // 2 普通
  { type: 'video', scene: 'food', count: 2 },      // 2 美食
  { type: 'card', cardId: 'food-a2-sushi' },       // 美食行动卡
  { type: 'video', scene: 'noise', count: 2 },     // 2 普通
  { type: 'card', cardId: 'trip-complete-1' },     // 邀约完成
]

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function build() {
  console.log('▶ 合并 6 场景 config + 30 mock user → 全量 videos')

  const allVideos = []
  for (const scene of SCENES) {
    const feed = generateSceneFeed(scene.id, scene.items, users)
    allVideos.push(...feed)
    console.log(`  ✓ ${scene.id}: ${feed.length} 条`)
  }

  // 随机选 6 条做首屏
  const shuffled = allVideos.slice().sort(() => Math.random() - 0.5)
  const posts6 = shuffled.slice(0, 6)
  const posts = allVideos

  // 黄金顺序
  const golden = []
  for (const slot of GOLDEN_ORDER) {
    if (slot.type === 'video') {
      const pool = posts.filter((v) => v.scene === slot.scene)
      for (let k = 0; k < slot.count; k++) {
        golden.push(pool[(k * 7 + 13) % pool.length])
      }
    } else if (slot.type === 'card') {
      golden.push({ __is_action_card__: true, cardId: slot.cardId })
    }
  }

  // card triggers（行动卡插入位置）
  const cardTriggers = golden
    .map((item, idx) => ({ item, idx }))
    .filter((x) => x.item.__is_action_card__)
    .map((x) => ({ position: x.idx, cardId: x.item.cardId }))

  // 输出
  const outDir = path.resolve(__dirname, 'data')
  ensureDir(outDir)
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(posts, null, 2))
  fs.writeFileSync(path.join(outDir, 'posts6.json'), JSON.stringify(posts6, null, 2))
  fs.writeFileSync(path.join(outDir, 'golden-order.json'), JSON.stringify(golden, null, 2))
  fs.writeFileSync(path.join(outDir, 'card-triggers.json'), JSON.stringify(cardTriggers, null, 2))

  console.log(`\n✓ 全部 ${posts.length} 条 videos → ${outDir}/posts.json`)
  console.log(`✓ 首屏 6 条 → ${outDir}/posts6.json`)
  console.log(`✓ 黄金顺序 ${golden.length} 项 → ${outDir}/golden-order.json`)
  console.log(`✓ 行动卡插入位置 ${cardTriggers.length} 个 → ${outDir}/card-triggers.json`)
}

build()
