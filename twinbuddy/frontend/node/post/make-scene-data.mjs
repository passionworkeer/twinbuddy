#!/usr/bin/env node
/**
 * 通用场景视频数据生成脚本
 *
 * 用法：
 *   node make-scene-data.mjs <scene-id> <out-path> [count]
 *
 * 它从 CC0 公开 sample bucket 拉 URL + Unsplash cover，
 * 组合成符合 PRD 行动卡场景的 Feed 视频条目数组。
 * 不会爬抖音，遵守版权与合规。
 */
import fs from 'fs'
import path from 'path'

// 1. CC0 sample bucket list (Google Cloud Public)
const SAMPLE_MP4_BUCKET =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample'

// 公开 sample videos 列表（11 条，是 Google 公开 bucket 里的）
const SAMPLE_VIDEOS = [
  'BigBuckBunny.mp4',
  'ElephantsDream.mp4',
  'ForBiggerBlazes.mp4',
  'ForBiggerEscapes.mp4',
  'ForBiggerFun.mp4',
  'ForBiggerJoyrides.mp4',
  'ForBiggerMeltdowns.mp4',
  'Sintel.mp4',
  'SubaruOutbackOnStreetAndDirt.mp4',
  'TearsOfSteel.mp4',
  'VolkswagenGTIReview.mp4',
  'WeAreGoingOnBullrun.mp4',
  'WhatCarCanYouGetForAGrand.mp4'
]

// Picsum 给 cover 图（任意 size，不限次数）
function picsum(seed, w = 720, h = 1280) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

function mp4Url(name) {
  return `${SAMPLE_MP4_BUCKET}/${name}`
}

function makeAwemeId(scene, idx) {
  // 形如 v-<scene>-<idx>，全 ascii，避免和真实抖音 aweme_id 冲突
  return `mock-${scene}-${String(idx).padStart(4, '0')}`
}

/**
 * 构造一条视频条目
 * @param {string} scene 场景 ID
 * @param {number} idx 从 0 开始
 * @param {string} title 视频标题
 * @param {string[]} tags 标签数组
 * @returns {Object}
 */
function makeAweme({ scene, idx, title, tags = [], author }) {
  const sample = SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length]
  return {
    aweme_id: makeAwemeId(scene, idx),
    desc: title,
    create_time: 1710000000 + idx * 3600,
    music: {
      id: `music-${scene}-${idx}`,
      title: `场景音乐 - ${scene}`,
      author: 'TwinBuddy Mock',
      cover_medium: { url_list: [picsum(`${scene}-music-${idx}-m`, 200, 200)], width: 200, height: 200 },
      cover_thumb: { url_list: [picsum(`${scene}-music-${idx}-t`, 100, 100)], width: 100, height: 100 },
      play_url: {
        uri: `mock://music/${scene}/${idx}.mp3`,
        url_list: [`mock://music/${scene}/${idx}.mp3`],
        url_key: `mock-music-${idx}`
      },
      duration: 30,
      user_count: 0,
      owner_id: 'mock',
      owner_nickname: 'TwinBuddy Mock',
      is_original: false
    },
    video: {
      play_addr: {
        uri: `mock-video-${scene}-${idx}`,
        url_list: [mp4Url(sample)],
        width: 720,
        height: 1280,
        url_key: `mock-${idx}`
      },
      cover: {
        url_list: [picsum(`${scene}-cover-${idx}`, 720, 1280)],
        width: 720,
        height: 1280,
        uri: `mock-cover-${idx}`
      },
      height: 1280,
      width: 720,
      ratio: '720p',
      use_static_cover: false,
      duration: 30,
      horizontal_type: 0
    },
    share_url: `https://twinbuddy.dev/feed/${scene}/${idx}`,
    statistics: {
      digg_count: 1000 + idx * 17,
      comment_count: 100 + idx * 3,
      share_count: 20 + idx,
      play_count: 50000 + idx * 100
    },
    text_extra: tags.map((t, i) => ({ tag_name: t, start: i * 5, end: i * 5 + 3, type: 1 })),
    duration: 30,
    author_user_id: author.uid,
    // 关键字段：前端可基于此过滤/推行动卡
    scene,
    tags,
    is_action_trigger: false, // 由 merge-and-shuffle 后置翻转
    prevent_download: false,
    is_top: false
  }
}

/**
 * 主入口
 * @param {string} scene 场景 ID
 * @param {Array<{title:string,tags?:string[]}>} items 场景条目定义
 * @param {Array<Object>} authors 用户池（>=4 个）
 * @returns {Array<Object>}
 */
export function generateSceneFeed(scene, items, authors) {
  return items.map((it, idx) => {
    const author = authors[idx % authors.length]
    return makeAweme({
      scene,
      idx,
      title: it.title,
      tags: it.tags || [],
      author
    })
  })
}

// CLI 模式
// --help 标志：打印用法
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('make-scene-data.mjs — TwinBuddy 场景视频数据生成脚本')
  console.log('用法：在其他 .mjs 里 import { generateSceneFeed } 调用')
  console.log('示例：见 twinbuddy/frontend/node/post/scene-config/<scene>.mjs')
  process.exit(0)
}

if (process.argv[1] && process.argv[1].endsWith('make-scene-data.mjs')) {
  console.error('CLI 入口仅支持 --help。请 import { generateSceneFeed } 调用本模块。')
  console.error('参考：twinbuddy/frontend/node/post/scene-config/ 下的 <scene>.mjs')
  process.exit(1)
}
