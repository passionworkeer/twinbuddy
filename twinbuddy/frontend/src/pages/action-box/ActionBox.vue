<template>
  <!--
    ActionBox 行动箱 (F6)
    依据：PRD §22.5
    状态：待确认 / 已邀约 / 已完成 / 已取消
  -->
  <div class="action-box-page">
    <header class="ab-header">
      <div class="ab-back" @click="goBack">←</div>
      <h1>行动箱</h1>
    </header>

    <nav class="ab-tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="ab-tab"
        :class="{ active: state.tab === t.id }"
        @click="state.tab = t.id"
      >
        {{ t.label }}
        <span v-if="countByTab[t.id]" class="ab-tab-count">{{ countByTab[t.id] }}</span>
      </button>
    </nav>

    <div class="ab-list">
      <div v-if="filteredActions.length === 0" class="ab-empty">
        还没有{{ currentTabLabel }}的行动
      </div>
      <div
        v-for="a in filteredActions"
        :key="a.id"
        class="ab-item"
        @click="open(a)"
      >
        <div class="ab-item-title">{{ a.title }}</div>
        <div class="ab-item-meta">
          <span class="ab-item-scene">{{ sceneLabel(a.scene) }}</span>
          <span class="ab-item-time">{{ formatTime(a.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const TABS = [
  { id: 'pending', label: '待确认' },
  { id: 'invited', label: '已邀约' },
  { id: 'completed', label: '已完成' },
  { id: 'cancelled', label: '已取消' },
]

// mock 行动数据
const mockActions = [
  { id: 'a1', title: '你最近好像想找个轻松的周末短途旅行', scene: 'trip', status: 'pending', createdAt: Date.now() - 3600 * 1000 },
  { id: 'a2', title: '鮨·初今晚 19:30 不用排队', scene: 'food', status: 'invited', createdAt: Date.now() - 86400 * 1000 },
  { id: 'a3', title: '14 天肩背训练', scene: 'fitness', status: 'completed', createdAt: Date.now() - 86400 * 3 * 1000 },
  { id: 'a4', title: '周杰伦 8 月深圳站', scene: 'event', status: 'cancelled', createdAt: Date.now() - 86400 * 5 * 1000 },
]

const state = reactive({
  tab: 'pending',
  actions: mockActions,
})

const SCENE_LABELS = { trip: '旅行', food: '美食', fitness: '健身', study: '学习', event: '活动', shopping: '购物' }
const sceneLabel = (s) => SCENE_LABELS[s] || s

const countByTab = computed(() => {
  const m = {}
  for (const t of TABS) m[t.id] = state.actions.filter((a) => a.status === t.id).length
  return m
})

const filteredActions = computed(() => state.actions.filter((a) => a.status === state.tab))
const currentTabLabel = computed(() => TABS.find((t) => t.id === state.tab)?.label || '')

function formatTime(ts) {
  const d = new Date(ts)
  const diff = Date.now() - ts // ms
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60 / 1000)} 分钟前`
  if (diff < 86400 * 1000) return `${Math.floor(diff / 3600 / 1000)} 小时前`
  if (diff < 86400 * 7 * 1000) return `${Math.floor(diff / 86400 / 1000)} 天前`
  return d.toLocaleDateString('zh-CN')
}

function open(a) {
  router.push(`/card/${a.id}`)
}

function goBack() {
  router.back()
}
</script>

<style lang="less" scoped>
.action-box-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0a0a;
  color: #fff;
  z-index: 9990;
  overflow-y: auto;
}

.ab-header {
  display: flex;
  align-items: center;
  padding: 14rem 18rem;
  border-bottom: 1rem solid #222;
  background: rgba(10, 10, 10, 0.95);

  h1 {
    font-size: 17rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }
}

.ab-back {
  font-size: 18rem;
  color: #ffd84a;
  cursor: pointer;
  margin-right: 12rem;
}

.ab-tabs {
  display: flex;
  border-bottom: 1rem solid #222;
  background: rgba(10, 10, 10, 0.95);
  position: sticky;
  top: 50rem;
  z-index: 9;
}

.ab-tab {
  flex: 1;
  padding: 12rem 0;
  background: transparent;
  border: none;
  color: #888;
  font-size: 13rem;
  cursor: pointer;
  position: relative;

  &.active {
    color: #ffd84a;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30%;
      right: 30%;
      height: 2rem;
      background: #ffd84a;
      border-radius: 1rem;
    }
  }
}

.ab-tab-count {
  display: inline-block;
  background: rgba(255, 216, 74, 0.2);
  color: #ffd84a;
  padding: 0 6rem;
  border-radius: 8rem;
  font-size: 10rem;
  margin-left: 4rem;
}

.ab-list {
  padding: 12rem 18rem;
}

.ab-empty {
  text-align: center;
  color: #888;
  font-size: 13rem;
  padding: 40rem 0;
}

.ab-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10rem;
  padding: 12rem 14rem;
  margin-bottom: 8rem;
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
}

.ab-item-title {
  font-size: 14rem;
  color: #fff;
  margin-bottom: 4rem;
  line-height: 1.4;
}

.ab-item-meta {
  display: flex;
  align-items: center;
  gap: 8rem;
  font-size: 11rem;
  color: #888;
}

.ab-item-scene {
  background: rgba(255, 216, 74, 0.15);
  color: #ffd84a;
  padding: 1rem 6rem;
  border-radius: 4rem;
}
</style>
