<template>
  <!--
    AiTwinNegotiation 协商详情页 (F3)
    依据：PRD §6 + docs/component-designs.md §2
    核心：1 个关键瞬间 + 三段结构化（已达成 / 待确认 / 风险）
    拒绝：聊天记录转录、品牌自指、5 行 bullet 堆叠
  -->
  <div class="neg-page" id="neg-page">
    <header class="neg-header">
      <div class="neg-back" @click="goBack">← 返回</div>
      <div class="neg-title">AI 协商结果</div>
    </header>

    <div class="neg-body">
      <!-- 顶部声明 -->
      <div class="neg-disclaimer">
        你的 Twin 和 <strong>{{ partnerName }}</strong> 的 Twin 聊过 {{ rounds }} 轮。
        <br />
        这是 AI 摘要，最终决定权在双方真人。
      </div>

      <!-- 关键瞬间（1 个） -->
      <section v-if="summary.key_moment" class="neg-section neg-key-moment">
        <div class="neg-section-label">关键瞬间</div>
        <div class="neg-key-content">
          <div class="neg-key-line">
            <span class="neg-key-speaker">{{ speakerLabel(summary.key_moment.speaker) }}：</span>
            <span class="neg-key-text">"{{ summary.key_moment.text }}"</span>
          </div>
          <div class="neg-key-detected">
            冲突：<strong>{{ summary.key_moment.detected_conflict }}</strong>
          </div>
          <div class="neg-key-resolution">
            ✓ 协商结果：{{ summary.key_moment.resolution }}
          </div>
        </div>
      </section>

      <!-- 已达成共识 -->
      <section v-if="summary.agreed?.length" class="neg-section">
        <div class="neg-section-label">
          <span class="neg-check">✓</span> 已达成共识
        </div>
        <ul class="neg-list">
          <li v-for="(item, i) in summary.agreed" :key="'a' + i" class="neg-list-item">
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- 待确认 -->
      <section v-if="summary.pending?.length" class="neg-section">
        <div class="neg-section-label">
          <span class="neg-pending">·</span> 待确认
        </div>
        <ul class="neg-list">
          <li v-for="(item, i) in summary.pending" :key="'p' + i" class="neg-list-item neg-list-pending">
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- 风险提示 -->
      <section v-if="summary.risks?.length" class="neg-section neg-risks">
        <div class="neg-section-label">
          <span class="neg-warn">⚠</span> 风险提示
        </div>
        <ul class="neg-list">
          <li v-for="(item, i) in summary.risks" :key="'r' + i" class="neg-list-item neg-list-risk">
            {{ item }}
          </li>
        </ul>
      </section>

      <!-- 推进程度（永远 < 100%） -->
      <section class="neg-section neg-progress">
        <div class="neg-progress-label">推荐推进程度</div>
        <div class="neg-progress-row">
          <div class="neg-progress-bar">
            <div class="neg-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="neg-progress-value">{{ summary.progress || 0 }}%</div>
        </div>
        <div class="neg-progress-hint">
          AI 不替你们做决定。{{ summary.progress < 80 ? '还有未达成项需要你们协商。' : '接近可以推进，但最终权在你们。' }}
        </div>
      </section>

      <!-- 行动 -->
      <section class="neg-actions">
        <button
          class="neg-btn neg-btn-primary"
          :disabled="!summary.progress || summary.progress < 50"
          @click="onAction('accept')"
        >
          接受方案，去邀约
        </button>
        <button class="neg-btn" @click="onAction('plan_only')">
          只要计划，不要人
        </button>
        <button class="neg-btn" @click="onAction('renegotiate')">
          让 AI 再协商一轮
        </button>
        <button class="neg-btn" @click="onAction('switch')">
          换一个搭子
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * AI 分身协商结果页
 * 数据契约：docs/action-cards.md §8
 */
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// props（演示用：直接用 route query 传；或 props）
const props = defineProps({
  cardId: { type: String, default: '' },
  partnerName: { type: String, default: '对方' },
  rounds: { type: Number, default: 3 },
  summary: {
    type: Object,
    default: () => ({
      agreed: [],
      pending: [],
      risks: [],
      key_moment: null,
      progress: 79,
    }),
  },
})

// 重协商状态（避免 location.reload() 丢状态）
const renegoState = reactive({ busy: false, version: 0 })

// 推进程度永远 < 100%
const progressPercent = computed(() => Math.min(props.summary.progress || 0, 99))

function speakerLabel(speaker) {
  return speaker === 'user_twin'
    ? '你的 Twin'
    : speaker === 'buddy_twin'
    ? '对方 Twin'
    : '系统'
}

function goBack() {
  router.back()
}

function onAction(type) {
  if (type === 'accept') {
    router.push({ path: `/invite/${props.cardId || 'mock'}/mock-candidate` })
  } else if (type === 'plan_only') {
    router.push({ path: `/invite/${props.cardId || 'mock'}/no-buddy` })
  } else if (type === 'renegotiate') {
    // 真正重跑：触发状态变更，调用方应监听 renegoState.version 重新计算 summary
    renegoState.busy = true
    renegoState.version++
    // mock 阶段：1.5s 后恢复
    setTimeout(() => {
      renegoState.busy = false
    }, 1500)
  } else if (type === 'switch') {
    router.back()
  }
}
</script>

<style lang="less" scoped>
.neg-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0a0a;
  color: #fff;
  z-index: 9998;
  overflow-y: auto;
}

.neg-header {
  position: sticky;
  top: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  padding: 14rem 18rem;
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1rem solid #222;
}

.neg-back {
  font-size: 14rem;
  color: #ffd84a;
  cursor: pointer;
  margin-right: 12rem;
}

.neg-title {
  font-size: 16rem;
  font-weight: 600;
  flex: 1;
}

.neg-body {
  padding: 18rem;
}

.neg-disclaimer {
  font-size: 12rem;
  color: #999;
  line-height: 1.6;
  padding: 10rem 12rem;
  background: rgba(255, 216, 74, 0.08);
  border-left: 3rem solid #ffd84a;
  border-radius: 6rem;
  margin-bottom: 16rem;
}

.neg-section {
  background: rgba(255, 255, 255, 0.04);
  padding: 14rem;
  border-radius: 10rem;
  margin-bottom: 12rem;
}

.neg-section-label {
  font-size: 13rem;
  color: #ffd84a;
  font-weight: 600;
  margin-bottom: 8rem;
  display: flex;
  align-items: center;
  gap: 6rem;
}

.neg-check {
  color: #5cd97a;
}

.neg-warn {
  color: #ff8b8b;
}

.neg-pending {
  color: #ddd;
}

.neg-key-moment {
  background: rgba(255, 216, 74, 0.08);
  border: 1rem solid rgba(255, 216, 74, 0.2);
}

.neg-key-content {
  font-size: 13rem;
  line-height: 1.6;
}

.neg-key-line {
  color: #fff;
  margin-bottom: 6rem;
}

.neg-key-speaker {
  color: #ffd84a;
  font-weight: 500;
}

.neg-key-text {
  color: #eee;
}

.neg-key-detected {
  font-size: 12rem;
  color: #ff8b8b;
  margin-bottom: 4rem;
}

.neg-key-resolution {
  font-size: 12rem;
  color: #5cd97a;
}

.neg-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.neg-list-item {
  font-size: 13rem;
  color: #ddd;
  line-height: 1.6;
  padding: 4rem 0 4rem 12rem;
  position: relative;
}

.neg-list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14rem;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: #ffd84a;
}

.neg-list-pending::before {
  background: #ddd;
}

.neg-list-risk {
  color: #ff8b8b;
}

.neg-list-risk::before {
  background: #ff8b8b;
}

.neg-risks {
  background: rgba(255, 100, 100, 0.08);
  border: 1rem solid rgba(255, 100, 100, 0.2);
}

.neg-progress {
  background: rgba(92, 217, 122, 0.06);
  border: 1rem solid rgba(92, 217, 122, 0.2);
}

.neg-progress-label {
  font-size: 12rem;
  color: #5cd97a;
  margin-bottom: 6rem;
}

.neg-progress-row {
  display: flex;
  align-items: center;
  gap: 8rem;
}

.neg-progress-bar {
  flex: 1;
  height: 8rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4rem;
  overflow: hidden;
}

.neg-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd84a 0%, #5cd97a 100%);
  border-radius: 4rem;
  transition: width 0.4s ease;
}

.neg-progress-value {
  font-size: 14rem;
  color: #5cd97a;
  font-weight: 600;
  min-width: 36rem;
  text-align: right;
}

.neg-progress-hint {
  font-size: 11rem;
  color: #999;
  margin-top: 6rem;
  font-style: italic;
}

.neg-actions {
  display: flex;
  flex-direction: column;
  gap: 8rem;
  margin-top: 16rem;
  padding-bottom: 24rem;
}

.neg-btn {
  padding: 12rem 16rem;
  border-radius: 24rem;
  font-size: 14rem;
  border: 1rem solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.neg-btn-primary {
  background: linear-gradient(135deg, #ffd84a 0%, #ffb84a 100%);
  color: #1a1a1a;
  border: none;
  font-weight: 600;
}
</style>
