import resource from '../assets/data/resource.js'
import posts6 from '@/assets/data/posts6.json'
import { _fetch, cloneDeep, random } from '@/utils'
import { BASE_URL, FILE_URL } from '@/config'
import { useBaseStore } from '@/store/pinia'
import { axiosInstance } from '@/utils/request'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axiosInstance)

function getPage2(params: any): { limit: number; offset: number; pageNo: number } {
  const offset = params.pageNo * params.pageSize
  const limit = params.pageNo * params.pageSize + params.pageSize
  return { limit, offset, pageNo: params.pageNo }
}

let allRecommendPosts = []
let userVideos = []
let allRecommendVideos = posts6.map((v: any) => {
  v.type = 'recommend-video'
  return v
})

// console.log('allRecommendVideos', allRecommendVideos)
// eslint-disable-next-line
const t = [
  {
    type: 'imgs',
    src: `https://imgapi.cn/bing.php`,
    author: {
      unique_id: 1,
      avatar_168x168: {
        url_list: []
      },
      avatar_300x300: {
        url_list: []
      },
      cover_url: [
        {
          url_list: []
        }
      ],
      white_cover_url: [
        {
          url_list: []
        }
      ]
    }
  }
  // {
  //   type: 'user',
  //   src: `https://imgapi.cn/bing.php`,
  //   author: {
  //     unique_id: 2,
  //     avatar_168x168: {
  //       url_list: []
  //     },
  //     avatar_300x300: {
  //       url_list: []
  //     },
  //     cover_url: [
  //       {
  //         url_list: []
  //       }
  //     ],
  //     white_cover_url: [
  //       {
  //         url_list: []
  //       }
  //     ]
  //   }
  // },
  // {
  //   type: 'img',
  //   src: `https://imgapi.cn/bing.php`,
  //   author: {
  //     unique_id: 3,
  //     avatar_168x168: {
  //       url_list: []
  //     },
  //     avatar_300x300: {
  //       url_list: []
  //     },
  //     cover_url: [
  //       {
  //         url_list: []
  //       }
  //     ],
  //     white_cover_url: [
  //       {
  //         url_list: []
  //       }
  //     ]
  //   }
  // }
]

// allRecommendVideos.unshift(...t)
// {
//   type: 'user-imgs',
//   src: `http://douyin.ttentau.top/0.mp4?vframe/jpg/offset/0/w/${document.body.clientWidth}`,
//   author: {
//     unique_id: uniqueId('list_')
//   }
// },
// {
//   type: 'user',
//   src: `http://douyin.ttentau.top/0.mp4?vframe/jpg/offset/0/w/${document.body.clientWidth}`,
//   author: {
//     unique_id: uniqueId('list_')
//   }
// },

async function fetchData() {
  const baseStore = useBaseStore()
  _fetch(BASE_URL + '/data/videos.md').then((r) => {
    r.json().then(async (v) => {
      let userList = cloneDeep(baseStore.users)
      if (!userList.length) {
        await baseStore.init()
        userList = cloneDeep(baseStore.users)
      }
      v = v.map((w) => {
        w.type = 'recommend-video'
        const item: any = userList.find((a) => String(a.uid) === String(w.author_user_id))
        if (item) w.author = item
        return w
      })
      allRecommendVideos = allRecommendVideos.concat(v)
    })
  })
}

//TODO 有个bug，一开始只返回了6条数据，但第二次前端传过来的pageNo是2了，就是会从第10条数据开始返回，导致中间漏了4条
export async function startMock() {
  mock.onGet(/video\/recommended/).reply(async (config) => {
    const { start, pageSize } = config.params
    // console.log('allRecommendVideos', cloneDeep(allRecommendVideos.length), config.params)
    return [
      200,
      {
        data: {
          total: 844,
          list: allRecommendVideos.slice(start, start + pageSize) // list: allRecommendVideos.slice(0, 6),
        },
        code: 200,
        msg: ''
      }
    ]
  })
  mock.onGet(/video\/long\/recommended/).reply(async (config) => {
    const page = getPage2(config.params)
    return [
      200,
      {
        data: {
          total: 844,
          list: allRecommendVideos.slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/video\/comments/).reply(async (config) => {
    const videoIds = [
      '7260749400622894336',
      '7128686458763889956',
      '7293100687989148943',
      '6923214072347512068',
      '7005490661592026405',
      '7161000281575148800',
      '7267478481213181238',
      '6686589698707590411',
      '7321200290739326262',
      '7194815099381484860',
      '6826943630775831812',
      '7110263965858549003',
      '7295697246132227343',
      '7270431418822446370',
      '6882368275695586568',
      '7000587983069957383'
    ]
    let id = config.params.id
    if (!videoIds.includes(String(id))) {
      id = videoIds[random(0, videoIds.length - 1)]
    }
    const r2 = await _fetch(`${FILE_URL}/comments/video_id_${id}.md`)
    const v = await r2.json()
    if (v) {
      return [200, { data: v, code: 200 }]
    }
    return [200, { code: 500 }]
  })

  mock.onGet(/video\/private/).reply(async (config) => {
    const page = getPage2(config.params)
    return [
      200,
      {
        data: {
          total: 10,
          list: allRecommendVideos.slice(100, 110).slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/video\/like/).reply(async (config) => {
    const page = getPage2(config.params)
    return [
      200,
      {
        data: {
          total: 150,
          list: allRecommendVideos.slice(200, 350).slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/video\/my/).reply(async (config) => {
    const page = getPage2(config.params)
    if (!userVideos.length) {
      // let r = await fetch(BASE_URL + '/data/user-71158770.json')
      // let r = await fetch(BASE_URL + '/data/user-8357999.json')
      const r = await _fetch(BASE_URL + '/data/user_video_list/user-12345xiaolaohu.md')
      const list = await r.json()
      const baseStore = useBaseStore()
      const userList = cloneDeep(baseStore.users)

      userVideos = list.map((w) => {
        if (userList.length) {
          const item = userList.find((a) => String(a.uid) === String(w.author_user_id))
          if (item) w.author = item
        }
        return w
      })
    }

    return [
      200,
      {
        data: {
          pageNo: page.pageNo,
          total: userVideos.length,
          list: userVideos.slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/video\/history/).reply(async (config) => {
    const page = getPage2(config.params)
    return [
      200,
      {
        data: {
          total: 150,
          list: allRecommendVideos.slice(200, 350).slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/user\/collect/).reply(async () => {
    return [
      200,
      {
        data: {
          video: {
            total: 50,
            list: allRecommendVideos.slice(350, 400)
          },
          music: {
            total: resource.music.length,
            list: resource.music
          }
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/user\/video_list/).reply(async (config) => {
    const id = config.params.id
    const r2 = await _fetch(`${FILE_URL}/user_video_list/user-${id}.md`)
    const v = await r2.json()
    if (v) {
      return [200, { data: v, code: 200 }]
    }
    return [200, { code: 500 }]
  })

  mock.onGet(/user\/panel/).reply(async () => {
    const r2 = await _fetch(BASE_URL + '/data/users.md')
    const v = await r2.json()
    // let item = v.find(a => a.uid === '68310389333')
    // let item = v.find(a => a.uid === '59054327754')
    const item = v.find((a) => a.uid === '2739632844317827')
    if (item) {
      return [200, { data: item, code: 200 }]
    }
    return [200, { code: 500 }]
  })

  mock.onGet(/user\/friends/).reply(async () => {
    const r2 = await _fetch(BASE_URL + '/data/users.md')
    const v = await r2.json()
    return [200, { data: v, code: 200 }]
  })

  mock.onGet(/historyOther/).reply(async (config) => {
    const page = getPage2(config.params)
    return [
      200,
      {
        data: {
          pageNo: page.pageNo,
          total: 0,
          list: []
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/post\/recommended/).reply(async (config) => {
    const page = getPage2(config.params)

    if (!allRecommendPosts.length) {
      const r = await _fetch(BASE_URL + '/data/posts.md')
      allRecommendPosts = await r.json()
    }
    return [
      200,
      {
        data: {
          pageNo: page.pageNo,
          total: allRecommendPosts.length,
          list: allRecommendPosts.slice(0, 1000).slice(page.offset, page.limit)
        },
        code: 200,
        msg: ''
      }
    ]
  })

  mock.onGet(/shop\/recommended/).reply(async (config) => {
    const page = getPage2(config.params)

    const r2 = await _fetch(BASE_URL + '/data/goods.md')
    const v = await r2.json()
    return [
      200,
      {
        data: {
          total: v.length,
          list: v.slice(page.offset, page.limit)
        },
        code: 200
      }
    ]
  })

  // ===== TwinBuddy 懂你行动卡 mock 拦截 =====
  // 依据：docs/frontend-overview.md §7.2
  // 数据契约：docs/action-cards.md §8

  // 白名单：防止 URL 注入 + scene 注入
  const ALLOWED_SCENES = ['trip', 'food', 'fitness', 'study', 'event', 'shopping']
  const ALLOWED_TONES = ['casual', 'direct', 'warm']

  // 真实 Wikimedia 封面池:从 public/data/scene-covers.json 拉,
  // 给 action-cards mock 的 candidate.avatar_url 优先用真图 URL。
  type WikimediaCover = { thumb_url: string; title: string; author: string; license: string; license_url: string }
  let wikiCovers: Record<string, WikimediaCover[]> = {}
  try {
    const res = await fetch(BASE_URL + '/data/scene-covers.json')
    if (res.ok) {
      const j = await res.json() as { scenes?: Record<string, WikimediaCover[]> }
      wikiCovers = j.scenes || {}
    }
  } catch (_e) { /* ignore — 用 picsum fallback */ }

  function pickAvatar(scene: string, seed: string): string {
    const list = wikiCovers[scene] || []
    if (list.length > 0) {
      let h = 0
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
      const idx = Math.abs(h) % list.length
      return list[idx].thumb_url
    }
    return 'https://picsum.photos/seed/' + seed + '/96/96'
  }

  // 加载并按 scene 过滤（直接 import 避免 fixture 双源问题）
  async function loadActionCards(scene) {
    try {
      // 浏览器运行时：动态 import 拿 default export
      const mod = await import(/* @vite-ignore */ `${BASE_URL}/data/action-cards.js`)
      let v = mod.default || []
      // 真实数据注入:每个 candidate 的 avatar_url 用真 Wikimedia URL 替换
      v = v.map((c) => {
        if (!c.candidates) return c
        const newCands = c.candidates.map((u, i) => ({
          ...u,
          avatar_url: pickAvatar(c.scene || 'trip', `${c.id || 'card'}-${i}`),
        }))
        return { ...c, candidates: newCands }
      })
      if (scene && ALLOWED_SCENES.includes(scene)) {
        return { code: 200, data: v.filter((c) => c.scene === scene) }
      }
      return { code: 200, data: v }
    } catch (e) {
      return { code: 500, msg: 'mock fixture import failed: ' + (e?.message || 'unknown') }
    }
  }

  mock.onGet(/action-cards\/trip\/featured$/).reply(async () => {
    return [200, await loadActionCards('trip')]
  })

  // 其它 5 场景统一走 loadActionCards 白名单过滤(防止 URL 注入)
  for (const scene of ['food', 'fitness', 'study', 'event', 'shopping']) {
    mock.onGet(new RegExp(`action-cards\\/${scene}\\/featured$`)).reply(async () => {
      return [200, await loadActionCards(scene)]
    })
  }

  mock.onGet(/action-cards\/featured$/).reply(async () => {
    return [200, await loadActionCards(null)]
  })

  // 降权：mock 写入 localStorage(与 utils/feed-dampener.js 同样机制),
  // 累计 skip_count >= 3 设 24h 过期标记
  mock.onPost(/action-cards\/dampen$/).reply(async (config) => {
    let payload = {}
    try {
      payload = JSON.parse(config.data || '{}')
    } catch (e) {
      return [400, { code: 400, msg: 'invalid_json', data: null }]
    }
    if (!payload.scene || !ALLOWED_SCENES.includes(payload.scene)) {
      return [400, { code: 400, msg: 'invalid_scene', data: null }]
    }
    let dampened = false
    let expiry: number | null = null
    try {
      const storageKey = 'twinbuddy.dampen.v1'
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null
      const state: Record<string, { skip_count: number; expiry: number | null; last_seen: number }> =
        raw ? JSON.parse(raw) : {}
      const prev = state[payload.scene] || { skip_count: 0, expiry: null, last_seen: 0 }
      const skipCount = (prev.skip_count || 0) + (payload.skip_count || 1)
      const now = Date.now()
      if (skipCount >= 3) {
        expiry = now + 24 * 3600 * 1000
        dampened = true
      }
      state[payload.scene] = { skip_count: skipCount, expiry, last_seen: now }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(state))
      }
      if (typeof console !== 'undefined') {
        console.log('[mock:dampen]', { scene: payload.scene, skip_count: skipCount, dampened, expiry })
      }
    } catch (e) {
      // ignore — mock 不阻塞业务
    }
    return [200, { code: 200, msg: '', data: { scene: payload.scene, dampened, expiry } }]
  })

  // 邀约文案渲染：根据 scene + tone 返回真人语气文案
  // 真实生产：调 LLM 生成（mock 阶段用模板）
  mock.onGet(/action-cards\/invite$/).reply(async (config) => {
    const scene = config.params?.scene || 'trip'
    const tone = config.params?.tone || 'casual'
    // 白名单：白名单外的值 fallback 到 trip.casual
    const safeScene = ALLOWED_SCENES.includes(scene) ? scene : 'trip'
    const safeTone = ALLOWED_TONES.includes(tone) ? tone : 'casual'
    const invites = {
      trip: {
        casual: '我周六 14:00 也想去大鹏吹吹风，你那边刚好顺路吗？预算 180 我俩 AA 还行，到时微信约时间？',
        direct: '周六 14:00 大鹏，预算 180 AA，地铁口见。',
        warm: '哇好巧我也想去大鹏！周六 14:00 地铁口见？预算 180 我俩 AA～',
      },
      food: {
        casual: '你收藏的 3 家里，鮨·初今晚 19:30 不用排队（人均 110），约个人一起去？我 19:00 出公司，AA 就行。',
        direct: '鮨·初今晚 19:30，人均 110，AA。要一起吗？',
        warm: '鮨·初 19:30 不用排队哎！约个人一起？人均 110 AA 就行～',
      },
    }
    const text = invites[safeScene]?.[safeTone] || invites.trip.casual
    return [200, { data: { text, scene: safeScene, tone: safeTone }, code: 200, msg: '' }]
  })

  setTimeout(fetchData, 1000)
}
