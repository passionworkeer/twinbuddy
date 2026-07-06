<template>
  <!--
    ActionCard 通用懂你行动卡组件
    依据：PRD §5.2 + docs/component-designs.md §1 + docs/action-cards.md §8
    4 态：hint | plan | buddy | complete
    拒绝：聊天记录转录、品牌自指（"路线可以按 TwinBuddy 这版走"）
  -->
  <div
    class="action-card"
    :class="['variant-' + data.variant, 'scene-' + data.scene, { dampened: data.meta?.dampened }]"
    :data-card-id="data.id"
  >
    <!-- 顶部：场景 icon + 截止时间 + 成熟度角标 -->
    <header class="ac-header">
      <div class="ac-scene">
        <span class="ac-scene-icon" :class="'icon-' + data.scene"></span>
        <span class="ac-scene-name">{{ sceneName }}</span>
      </div>
      <div class="ac-meta">
        <span v-if="data.meta?.deadline" class="ac-deadline">⏰ {{ data.meta.deadline }}</span>
        <span
          v-if="data.meta?.twins_maturity"
          class="ac-maturity"
          :title="maturityTooltip"
        >
          <span
            v-for="i in maturityLevel"
            :key="i"
            class="ac-maturity-dot"
            :class="{ filled: i <= maturityLevel }"
          ></span>
        </span>
      </div>
    </header>

    <!-- 主体：标题 + 触发原因 -->
    <section class="ac-body">
      <h2 class="ac-title">{{ data.title }}</h2>
      <p class="ac-trigger">
        <span class="ac-trigger-label">AI 看到了</span>
        {{ data.trigger_reason }}
      </p>
    </section>

    <!-- hint 态：轻提示卡 -->
    <section v-if="data.variant === 'hint'" class="ac-hint">
      <div class="ac-hint-actions">
        <button class="ac-btn ac-btn-primary" @click="onAction({ type: 'reveal_plan' })">
          帮我看看
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'dampen' })">
          暂时不用
        </button>
        <button class="ac-btn ac-btn-text" @click="onAction({ type: 'dampen_permanent' })">
          不再推这类
        </button>
      </div>
    </section>

    <!-- plan 态：行动方案卡 -->
    <section v-else-if="data.variant === 'plan'" class="ac-plan">
      <div class="ac-intent">
        <span class="ac-intent-label">行动意图</span>
        <span class="ac-intent-value">{{ data.intent }}</span>
      </div>
      <div class="ac-plan-content">
        <span class="ac-plan-label">行动方案</span>
        <p class="ac-plan-text">{{ data.plan }}</p>
      </div>
      <div v-if="data.meta?.budget" class="ac-budget">
        预算 {{ data.meta.budget.min }}-{{ data.meta.budget.max }} 元
      </div>
      <div class="ac-hint-actions">
        <button class="ac-btn ac-btn-primary" @click="onAction({ type: 'reveal_buddy' })">
          {{ data.needs_buddy === 'none' ? '查看方案' : '看搭子' }}
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'save' })">
          收藏
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'switch_plan' })">
          换一个
        </button>
        <button class="ac-btn ac-btn-text" @click="onAction({ type: 'dampen' })">
          抑制此类
        </button>
      </div>
    </section>

    <!-- buddy 态：搭子协商卡 -->
    <section v-else-if="data.variant === 'buddy'" class="ac-buddy">
      <div v-if="data.candidates?.length" class="ac-candidates">
        <div
          v-for="(c, i) in data.candidates"
          :key="c.id"
          class="ac-candidate"
          :class="['match-' + c.match_label, { active: selectedCandidate === c.id }]"
          @click="selectedCandidate = c.id"
        >
          <img
            class="ac-candidate-avatar"
            :src="avatarUrl(c)"
            :alt="c.nickname"
            @error="onAvatarError($event, c)"
          />
          <div class="ac-candidate-info">
            <div class="ac-candidate-name">
              <span class="ac-candidate-label">{{ labelOf(c.match_label) }}</span>
              {{ c.nickname }}
            </div>
            <div class="ac-candidate-reason">{{ c.match_reason }}</div>
            <div v-if="c.conflicts?.length" class="ac-candidate-conflicts">
              <span v-for="(k, j) in c.conflicts" :key="j" class="ac-conflict">{{ k }}</span>
            </div>
          </div>
          <span v-if="selectedCandidate === c.id" class="ac-candidate-check">✓</span>
        </div>
      </div>

      <div v-if="data.negotiation_summary" class="ac-negotiation">
        <div class="ac-negotiation-disclaimer">
          你的 Twin 和对方的 Twin 聊过。这是 AI 摘要，最终决定权在双方真人。
        </div>

        <div v-if="data.negotiation_summary.key_moment" class="ac-key-moment">
          <div class="ac-key-moment-label">关键瞬间</div>
          <div class="ac-key-moment-content">
            <div class="ac-key-line">
              <span class="ac-key-speaker">{{ speakerName(data.negotiation_summary.key_moment.speaker) }}</span>
              <span>"{{ data.negotiation_summary.key_moment.text }}"</span>
            </div>
            <div class="ac-key-detected">
              — 冲突：{{ data.negotiation_summary.key_moment.detected_conflict }}
            </div>
            <div class="ac-key-resolution">
              ✓ 协商结果：{{ data.negotiation_summary.key_moment.resolution }}
            </div>
          </div>
        </div>

        <div class="ac-summary-block">
          <div class="ac-summary-label">✓ 已达成</div>
          <ul class="ac-summary-list">
            <li v-for="(item, i) in data.negotiation_summary.agreed" :key="'a' + i">{{ item }}</li>
          </ul>
        </div>

        <div v-if="data.negotiation_summary.pending?.length" class="ac-summary-block">
          <div class="ac-summary-label">· 待确认</div>
          <ul class="ac-summary-list">
            <li v-for="(item, i) in data.negotiation_summary.pending" :key="'p' + i">{{ item }}</li>
          </ul>
        </div>

        <div v-if="data.negotiation_summary.risks?.length" class="ac-summary-block ac-risks">
          <div class="ac-summary-label">⚠ 风险</div>
          <ul class="ac-summary-list">
            <li v-for="(item, i) in data.negotiation_summary.risks" :key="'r' + i">{{ item }}</li>
          </ul>
        </div>

        <div class="ac-progress">
          <div class="ac-progress-label">推荐推进程度</div>
          <div class="ac-progress-bar">
            <div class="ac-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="ac-progress-value">{{ data.negotiation_summary.progress }}%</div>
        </div>
      </div>

      <div class="ac-hint-actions">
        <button
          class="ac-btn ac-btn-primary"
          :disabled="!selectedCandidate"
          @click="onAction({ type: 'invite', candidate_id: selectedCandidate })"
        >
          {{ selectedCandidate ? '选 ' + candidateNickname : '请先选搭子' }}
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'plan_only' })">
          只要计划不要人
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'switch_buddy' })">
          换一个人
        </button>
        <button class="ac-btn ac-btn-text" @click="onAction({ type: 'dampen' })">
          抑制此类
        </button>
      </div>
    </section>

    <!-- complete 态：推进完成卡 -->
    <section v-else-if="data.variant === 'complete'" class="ac-complete">
      <div class="ac-invite-label">邀约文案</div>
      <div class="ac-invite-text">"{{ data.invite_text }}"</div>
      <div class="ac-invite-disclaimer">
        邀约权在双方真人。AI 不会替你们自动同意线下见面。
      </div>
      <div v-if="data.follow_up?.length" class="ac-follow-ups">
        <button
          v-for="(f, i) in data.follow_up"
          :key="i"
          class="ac-btn ac-btn-ghost ac-btn-block"
          @click="onAction({ type: 'follow_up', payload: f })"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="ac-hint-actions">
        <button class="ac-btn ac-btn-primary" @click="onAction({ type: 'send_invite' })">
          发送邀约
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'rephrase' })">
          换个语气
        </button>
        <button class="ac-btn ac-btn-ghost" @click="onAction({ type: 'renegotiate' })">
          再协商一轮
        </button>
        <button class="ac-btn ac-btn-text" @click="onAction({ type: 'cancel' })">
          取消
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="jsx">
/**
 * ActionCard 通用懂你行动卡
 * 数据契约见 docs/action-cards.md §8
 */
import { computed, ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (v) => {
      // 必填字段（与 docs/action-cards.md §0 对齐）
      return v.id && v.scene && v.variant && v.title && v.trigger_reason
    },
  },
})

const emit = defineEmits(['action'])

// 选中的搭子（buddy 态）
const selectedCandidate = ref(null)

// 场景中文名
const SCENE_NAMES = {
  trip: '旅行',
  food: '美食',
  fitness: '健身',
  study: '学习',
  event: '活动',
  shopping: '购物',
}
const sceneName = computed(() => SCENE_NAMES[props.data.scene] || props.data.scene)

// 成熟度角标
const MATURITY_LEVELS = { novice: 1, intermediate: 2, advanced: 3 }
const maturityLevel = computed(() => MATURITY_LEVELS[props.data.meta?.twins_maturity] || 1)
const maturityTooltip = computed(() => {
  const map = {
    novice: '你的 Twin 刚加入 3 天，了解你 20%',
    intermediate: '你的 Twin 看了 20+ 内容 + 3 张行动卡',
    advanced: '你的 Twin 走过 1 次完整协商闭环',
  }
  return map[props.data.meta?.twins_maturity] || map.novice
})

// 协商进度条（永远 < 100%）
const progressPercent = computed(() => {
  const p = props.data.negotiation_summary?.progress || 0
  return Math.min(p, 99)
})

// 候选人标签
const MATCH_LABELS = {
  most_match: '最匹配',
  most_complement: '最互补',
  most_interesting: '最有意思',
}
const labelOf = (label) => MATCH_LABELS[label] || label

// 候选人昵称（按钮文字用）
const candidateNickname = computed(() => {
  if (!selectedCandidate.value) return ''
  const c = props.data.candidates?.find((x) => x.id === selectedCandidate.value)
  return c ? c.nickname : ''
})

// 头像 URL
function avatarUrl(c) {
  if (c.avatar_url) return c.avatar_url
  // fallback: picsum seed（不会过期，可播放 mock）
  return `https://picsum.photos/seed/${encodeURIComponent(c.id || 'mock')}/96/96`
}

function onAvatarError(e, c) {
  // 头像加载失败 → 用 picsum 占位
  e.target.src = `https://picsum.photos/seed/${encodeURIComponent(c.id || 'mock')}/96/96`
}

function speakerName(speaker) {
  return speaker === 'user_twin' ? '你的 Twin' : speaker === 'buddy_twin' ? '对方 Twin' : '系统'
}

function onAction(action) {
  emit('action', action)
}
</script>

<style lang="less" scoped>
.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 92%;
  margin: 0 auto;
  padding: 16rem 18rem 18rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border-radius: 16rem;
  color: #fff;
  box-sizing: border-box;
  font-size: 14rem;
  box-shadow: 0 8rem 32rem rgba(0, 0, 0, 0.4);

  &.dampened {
    opacity: 0.5;
  }
}

.ac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rem;
}

.ac-scene {
  display: flex;
  align-items: center;
  gap: 6rem;
  font-size: 12rem;
  color: #aaa;
}

.ac-scene-icon {
  display: inline-block;
  width: 18rem;
  height: 18rem;
  border-radius: 50%;
  background: #444;
  vertical-align: middle;
}

.ac-meta {
  display: flex;
  align-items: center;
  gap: 10rem;
  font-size: 11rem;
  color: #888;
}

.ac-deadline {
  background: rgba(255, 100, 100, 0.15);
  color: #ff8b8b;
  padding: 2rem 8rem;
  border-radius: 10rem;
}

.ac-maturity {
  display: inline-flex;
  gap: 3rem;
}

.ac-maturity-dot {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background: #333;
  &.filled {
    background: #ffd84a;
  }
}

.ac-body {
  margin-bottom: 14rem;
}

.ac-title {
  font-size: 18rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 8rem;
  color: #fff;
}

.ac-trigger {
  font-size: 12rem;
  color: #999;
  line-height: 1.5;
  margin: 0;
}

.ac-trigger-label {
  display: inline-block;
  background: rgba(255, 216, 74, 0.18);
  color: #ffd84a;
  padding: 1rem 6rem;
  border-radius: 4rem;
  margin-right: 6rem;
  font-weight: 500;
}

.ac-hint-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8rem;
  margin-top: 12rem;
}

.ac-btn {
  flex: 1;
  min-width: 80rem;
  padding: 9rem 12rem;
  border-radius: 22rem;
  font-size: 13rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.ac-btn-primary {
  background: linear-gradient(135deg, #ffd84a 0%, #ffb84a 100%);
  color: #1a1a1a;
  font-weight: 600;
}

.ac-btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1rem solid rgba(255, 255, 255, 0.15);
}

.ac-btn-text {
  background: transparent;
  color: #999;
}

.ac-btn-block {
  display: block;
  width: 100%;
  margin-bottom: 8rem;
  text-align: left;
}

.ac-intent {
  display: flex;
  align-items: center;
  gap: 8rem;
  margin-bottom: 10rem;
  font-size: 13rem;
}

.ac-intent-label {
  color: #888;
}

.ac-intent-value {
  color: #ffd84a;
  font-weight: 500;
}

.ac-plan-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 10rem 12rem;
  border-radius: 8rem;
  margin-bottom: 10rem;
}

.ac-plan-label {
  display: block;
  color: #888;
  font-size: 11rem;
  margin-bottom: 4rem;
}

.ac-plan-text {
  margin: 0;
  color: #eee;
  line-height: 1.5;
  font-size: 14rem;
}

.ac-budget {
  font-size: 12rem;
  color: #aaa;
  margin-bottom: 10rem;
  text-align: right;
}

.ac-candidates {
  display: flex;
  flex-direction: column;
  gap: 8rem;
  margin-bottom: 14rem;
}

.ac-candidate {
  display: flex;
  align-items: center;
  gap: 10rem;
  padding: 10rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rem;
  cursor: pointer;
  border: 2rem solid transparent;
  transition: border-color 0.2s, background 0.2s;

  &.active {
    border-color: #ffd84a;
    background: rgba(255, 216, 74, 0.08);
  }
}

.ac-candidate-avatar {
  width: 48rem;
  height: 48rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: #333;
}

.ac-candidate-info {
  flex: 1;
  min-width: 0;
}

.ac-candidate-name {
  display: flex;
  align-items: center;
  gap: 6rem;
  font-size: 13rem;
  color: #fff;
  font-weight: 500;
}

.ac-candidate-label {
  display: inline-block;
  background: rgba(255, 216, 74, 0.2);
  color: #ffd84a;
  padding: 1rem 6rem;
  border-radius: 4rem;
  font-size: 10rem;
  font-weight: 500;
}

.ac-candidate-reason {
  font-size: 11rem;
  color: #aaa;
  margin-top: 2rem;
}

.ac-candidate-conflicts {
  display: flex;
  flex-wrap: wrap;
  gap: 4rem;
  margin-top: 4rem;
}

.ac-conflict {
  font-size: 10rem;
  color: #ff8b8b;
  background: rgba(255, 100, 100, 0.12);
  padding: 1rem 6rem;
  border-radius: 4rem;
}

.ac-candidate-check {
  font-size: 20rem;
  color: #ffd84a;
  font-weight: bold;
  flex-shrink: 0;
}

.ac-negotiation {
  background: rgba(0, 0, 0, 0.3);
  padding: 12rem;
  border-radius: 10rem;
  margin-bottom: 12rem;
  border-left: 3rem solid #ffd84a;
}

.ac-negotiation-disclaimer {
  font-size: 10rem;
  color: #888;
  margin-bottom: 10rem;
  font-style: italic;
}

.ac-key-moment {
  background: rgba(255, 216, 74, 0.08);
  border-radius: 8rem;
  padding: 10rem;
  margin-bottom: 10rem;
}

.ac-key-moment-label {
  font-size: 11rem;
  color: #ffd84a;
  font-weight: 600;
  margin-bottom: 6rem;
}

.ac-key-line {
  display: flex;
  gap: 6rem;
  font-size: 12rem;
  color: #fff;
  line-height: 1.5;
  margin-bottom: 4rem;
}

.ac-key-speaker {
  color: #ffd84a;
  font-weight: 500;
  flex-shrink: 0;
}

.ac-key-detected,
.ac-key-resolution {
  font-size: 11rem;
  color: #ccc;
  margin-top: 2rem;
}

.ac-key-resolution {
  color: #5cd97a;
}

.ac-summary-block {
  margin-bottom: 8rem;
}

.ac-summary-label {
  font-size: 11rem;
  color: #888;
  margin-bottom: 4rem;
  font-weight: 500;
}

.ac-risks .ac-summary-label {
  color: #ff8b8b;
}

.ac-summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ac-summary-list li {
  font-size: 12rem;
  color: #ddd;
  line-height: 1.5;
  padding-left: 8rem;
  position: relative;
}

.ac-summary-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #555;
}

.ac-progress {
  display: flex;
  align-items: center;
  gap: 8rem;
  margin-top: 8rem;
}

.ac-progress-label {
  font-size: 11rem;
  color: #888;
  white-space: nowrap;
}

.ac-progress-bar {
  flex: 1;
  height: 6rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3rem;
  overflow: hidden;
}

.ac-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd84a 0%, #5cd97a 100%);
  border-radius: 3rem;
  transition: width 0.3s ease;
}

.ac-progress-value {
  font-size: 12rem;
  color: #ffd84a;
  font-weight: 600;
  min-width: 32rem;
  text-align: right;
}

.ac-invite-label {
  font-size: 11rem;
  color: #888;
  margin-bottom: 6rem;
}

.ac-invite-text {
  background: rgba(255, 216, 74, 0.08);
  border-left: 3rem solid #ffd84a;
  padding: 12rem;
  border-radius: 8rem;
  font-size: 14rem;
  color: #fff;
  line-height: 1.6;
  margin-bottom: 10rem;
}

.ac-invite-disclaimer {
  font-size: 10rem;
  color: #888;
  font-style: italic;
  margin-bottom: 12rem;
}

.ac-follow-ups {
  display: flex;
  flex-direction: column;
  margin-bottom: 10rem;
}
</style>
