<template>
  <!--
    TwinBuddy 黄金顺序 Feed (F0)
    依据：PRD §10.4 + docs/component-designs.md §4
    顺序：8 普通视频 → 轻提示卡 → 2 普通 → 行动卡 → 4 普通 → 第 2 张卡 → 邀约
  -->
  <div class="feed-page" id="feed-page">
    <header class="feed-header">
      <div class="feed-title">为你推荐</div>
      <div class="feed-subtitle">基于你最近的行为</div>
    </header>

    <SlideList
      :active="true"
      uniqueId="golden-feed"
      :api="feedApi"
      :list="state.list"
    />

    <!-- 行动卡浮层（被单点击时弹出） -->
    <Teleport to="body">
      <transition name="action-card-fade">
        <ActionCard
          v-if="state.activeCard"
          :data="state.activeCard"
          class="action-card-overlay"
          @action="onCardAction"
        />
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="jsx">
/**
 * 黄金顺序 Feed
 * - 复用 zyronon/douyin 的 SlideList + SlideVerticalInfinite
 * - 把 mock 视频 + 行动卡混排在同一个 list 里
 * - 视频项走 BaseVideo 渲染（继承自 slideItemRender）
 * - 行动卡项走 ActionCard（覆盖默认 render）
 */
import SlideList from '@/pages/home/slide/SlideList.vue'
import ActionCard from '@/components/ActionCard.vue'
import { onMounted, reactive, ref } from 'vue'
import { useBaseStore } from '@/store/pinia'
import { allMockCards, tripCardA1, foodCardA2, tripCompleteCard } from '@/mocks/action-cards'

const baseStore = useBaseStore()

const state = reactive({
  list: [],
  pageSize: 20,
  totalSize: 0,
  index: 0,
  activeCard: null,
  seenCardIds: new Set(),
})

// 黄金顺序定义（依据 PRD §10.4）
const GOLDEN_ORDER = [
  { type: 'video', count: 8 },
  { type: 'card', card: 'trip-hint-1' },
  { type: 'video', count: 2 },
  { type: 'card', card: 'trip-a1-dapeng' },
  { type: 'video', count: 4 },
  { type: 'card', card: 'food-a2-sushi' },
  { type: 'card', card: 'trip-complete-1' },
]

// 用 mock 视频数据填充视频位
const MOCK_VIDEOS = Array.from({ length: 30 }, (_, i) => ({
  aweme_id: `mock-video-${i + 1}`,
  type: 'recommend-video',
  desc: `推荐视频 #${i + 1}（mock feed）`,
  video: {
    play_addr: {
      url_list: [`https://picsum.photos/seed/feed-${i + 1}/720/1280`],
    },
    cover: {
      url_list: [`https://picsum.photos/seed/feed-${i + 1}/720/1280`],
    },
    duration: 15,
  },
  author: {
    nickname: `用户${(i % 6) + 1}`,
    avatar_168x168: { url_list: [`https://picsum.photos/seed/user-${i + 1}/96/96`] },
  },
  statistics: {
    digg_count: 1000 + i * 17,
    comment_count: 100 + i * 3,
    share_count: 20 + i,
  },
}))

/**
 * 黄金顺序 → 实际 list
 * 视频位用 MOCK_VIDEOS，行动卡位用 allMockCards
 */
function buildGoldenList() {
  const result = []
  let videoIdx = 0
  for (const slot of GOLDEN_ORDER) {
    if (slot.type === 'video') {
      for (let k = 0; k < slot.count; k++) {
        result.push(MOCK_VIDEOS[videoIdx % MOCK_VIDEOS.length])
        videoIdx++
      }
    } else if (slot.type === 'card') {
      const card = allMockCards.find((c) => c.id === slot.card)
      if (card) {
        // 在 list 中插入一个 marker，SlideList 不识别时会被原样渲染
        // 通过 aweme_id 前缀 '__action_card__' 区分
        result.push({
          __is_action_card__: true,
          __card_data__: card,
        })
      }
    }
  }
  return result
}

/**
 * feed API
 * 模拟分页：第一次返回前 N 条，后续返回更多
 */
async function feedApi({ start = 0, pageSize = 20 } = {}) {
  if (state.list.length === 0) {
    state.list = buildGoldenList()
  }
  // 第一页返回黄金顺序，后续返回更多视频
  if (start === 0) {
    state.totalSize = 20
    return {
      success: true,
      data: {
        total: 20,
        list: state.list.slice(0, pageSize),
      },
    }
  }
  // 第二页及之后：返回剩余视频 + 偶发行动卡
  const moreVideos = MOCK_VIDEOS.slice(start % 30, (start % 30) + pageSize)
  return {
    success: true,
    data: {
      total: 200,
      list: moreVideos.map((v) => ({ ...v })),
    },
  }
}

/**
 * 行动卡 action 处理
 * - 'reveal_plan': hint 态 → plan 态
 * - 'reveal_buddy': plan 态 → buddy 态
 * - 'invite': buddy 态 → complete 态
 * - 'plan_only': 只要计划
 * - 'dampen': 抑制本场景（24h 不推）
 */
function onCardAction(action) {
  const card = state.activeCard
  if (!card) return
  if (action.type === 'reveal_plan') {
    state.activeCard = { ...tripCardA1, variant: 'plan' }
  } else if (action.type === 'reveal_buddy') {
    state.activeCard = { ...card, variant: 'buddy' }
  } else if (action.type === 'invite') {
    state.activeCard = { ...tripCompleteCard }
  } else if (action.type === 'plan_only') {
    state.activeCard = { ...tripCompleteCard }
  } else if (action.type === 'dampen') {
    // 抑制：标记 + 关闭卡片
    state.seenCardIds.add(card.scene)
    state.activeCard = null
  } else if (action.type === 'save') {
    // 收藏：mock 即可
  } else if (action.type === 'cancel') {
    state.activeCard = null
  }
}

onMounted(() => {
  // 监听用户点击行动卡的 marker（来自 SlideList 的 SINGLE_CLICK）
  // 此处简化：直接定时器模拟演示
  // 实际应通过 bus 监听，但 demo 模式手动触发更可控
  state.activeCard = {
    id: 'trip-hint-1',
    scene: 'trip',
    variant: 'hint',
    title: '你最近好像想找个轻松的周末短途旅行',
    trigger_reason: '基于你最近看了 4 条深圳周边游 + 周末空闲',
    intent: '',
    plan: '',
    needs_buddy: 'optional',
    candidates: [],
    next_actions: [],
    follow_up: [],
    risks: [],
    meta: { twins_maturity: 'novice' },
  }
})
</script>

<style lang="less" scoped>
.feed-page {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.feed-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9;
  padding: 12rem 18rem;
  color: #fff;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  pointer-events: none;
}

.feed-title {
  font-size: 17rem;
  font-weight: 600;
}

.feed-subtitle {
  font-size: 11rem;
  color: #999;
  margin-top: 2rem;
}

.action-card-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 92%;
  max-width: 480rem;
  max-height: 80vh;
  overflow-y: auto;
}

.action-card-fade-enter-active,
.action-card-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.action-card-fade-enter-from,
.action-card-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -45%);
}
</style>
