<template>
  <!--
    OneClickInvite 一键邀约页 (F4)
    依据：PRD §9.1 + docs/invite-templates.md
    核心：真人语气 + AA 信任锚 + 接洽方式（微信/群里）
    拒绝：品牌自指句（"路线可以按 TwinBuddy 这版走"）
  -->
  <div class="invite-page" id="invite-page">
    <header class="inv-header">
      <div class="inv-back" @click="goBack">← 返回</div>
      <div class="inv-title">邀约文案</div>
    </header>

    <div class="inv-body">
      <!-- 场景摘要 -->
      <div class="inv-context">
        <div class="inv-context-row">
          <span class="inv-context-label">场景</span>
          <span class="inv-context-value">{{ sceneLabel }}</span>
        </div>
        <div class="inv-context-row">
          <span class="inv-context-label">对方</span>
          <span class="inv-context-value">{{ partnerName }}</span>
        </div>
        <div v-if="deadline" class="inv-context-row">
          <span class="inv-context-label">时间</span>
          <span class="inv-context-value">{{ deadline }}</span>
        </div>
      </div>

      <!-- 邀约文案主体 -->
      <section class="inv-text-section">
        <div class="inv-text-label">邀约文案</div>
        <div class="inv-text-body">"{{ currentText }}"</div>
        <div class="inv-text-disclaimer">
          邀约权在双方真人。AI 不会替你们自动同意线下见面。
        </div>
      </section>

      <!-- 语气切换 -->
      <section class="inv-tone-section">
        <div class="inv-tone-label">换个语气：</div>
        <div class="inv-tone-buttons">
          <button
            v-for="t in TONES"
            :key="t.id"
            class="inv-tone-btn"
            :class="{ active: toneId === t.id }"
            @click="setTone(t.id)"
          >
            {{ t.label }}
          </button>
        </div>
      </section>

      <!-- 安全提示 -->
      <section class="inv-safety">
        <div class="inv-safety-title">⚠ 建议</div>
        <ul class="inv-safety-list">
          <li>首次见面建议公开场所（地铁口 / 商圈 / 咖啡店）</li>
          <li>不推荐深夜 23:00 后、偏僻地区</li>
          <li>建议分享行程给紧急联系人</li>
        </ul>
      </section>

      <!-- 后续承接（来自行动卡 follow_up） -->
      <section v-if="followUps?.length" class="inv-followups">
        <div class="inv-followups-label">还可以</div>
        <button
          v-for="(f, i) in followUps"
          :key="i"
          class="inv-followup-btn"
          @click="onFollowUp(f)"
        >
          {{ f.label }}
        </button>
      </section>

      <!-- 主行动 -->
      <section class="inv-actions">
        <button class="inv-btn inv-btn-primary" @click="sendInvite">复制并发送</button>
        <button class="inv-btn" @click="onAction('rephrase')">让 AI 改写</button>
        <button class="inv-btn" @click="onAction('renegotiate')">再协商一轮</button>
        <button class="inv-btn inv-btn-cancel" @click="onAction('cancel')">取消</button>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * 一键邀约文案页
 * 数据契约：docs/action-cards.md §8
 * 文案规范：docs/invite-templates.md
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  cardId: { type: String, default: '' },
  candidateId: { type: String, default: '' },
  scene: { type: String, default: 'trip' },
  partnerName: { type: String, default: '对方' },
  deadline: { type: String, default: '本周六 14:00' },
  followUps: {
    type: Array,
    default: () => [
      { type: 'route', label: '查看路线' },
      { type: 'food', label: '查看附近餐饮' },
      { type: 'hotel', label: '查看住宿' },
      { type: 'guide', label: '查看攻略' },
    ],
  },
})

// 文案语气变体（依据 docs/invite-templates.md 6 场景原则）
const TONES = [
  { id: 'casual', label: '轻松' },
  { id: 'direct', label: '直接' },
  { id: 'warm', label: '热情' },
]

const toneId = ref('casual')

const TEXTS = {
  casual: {
    trip: '我周六 14:00 也想去大鹏吹吹风，你那边刚好顺路吗？预算 180 我俩 AA 还行，到时微信约时间？',
    food: '你收藏的 3 家里，鮨·初今晚 19:30 不用排队（人均 110），约个人一起去？我 19:00 出公司，AA 就行。',
    fitness: '我 14 天每周 3 次肩背训练，要不要搭个伙一起？19:00 出门，楼下健身房见？',
    study: '我周一开始 AI Agent 7 天计划，每天 1 小时。要不要搭伙学？21:00 家里视频会议？',
    event: '你最近看了周杰伦 8 条视频，8/15 深圳站 480-680 票，一起抢吗？19:00 在深圳湾体育中心门口见？',
    shopping: '我想买通勤背包，300-500 上下，目前看到 3 款（JanSport / Herschel / Mystery Ranch），你帮看？',
  },
  direct: {
    trip: '周六 14:00 大鹏，预算 180 AA，地铁口见。',
    food: '鮨·初今晚 19:30，人均 110，AA。要一起吗？',
    fitness: '14 天肩背训练，每周一三五 19:00 楼下健身房，加一个？',
    study: 'AI Agent 7 天计划，周一开始每天 21:00 一小时，加入？',
    event: '8/15 周杰伦深圳站，一起抢票。19:00 体育中心门口见。',
    shopping: '通勤包 300-500，3 款候选。',
  },
  warm: {
    trip: '哇好巧我也想去大鹏！周六 14:00 地铁口见？预算 180 我俩 AA，到时微信联系～',
    food: '鮨·初 19:30 不用排队哎！约个人一起？人均 110 AA 就行～',
    fitness: '我准备 14 天肩背训练，你一起吗？互相督促效果好～',
    study: 'AI Agent 7 天计划，要搭伙吗？学完了说不定还能一起做项目！',
    event: '周杰伦 8/15 深圳站！一起抢票吧！19:00 门口见～',
    shopping: '我也在挑通勤包，要不一起看看？',
  },
}

const SCENE_LABELS = {
  trip: '旅行',
  food: '美食',
  fitness: '健身',
  study: '学习',
  event: '活动',
  shopping: '购物',
}

const sceneLabel = computed(() => SCENE_LABELS[props.scene] || props.scene)
const currentText = computed(() => {
  const bank = TEXTS[toneId.value] || TEXTS.casual
  return bank[props.scene] || bank.trip
})

function setTone(id) {
  toneId.value = id
}

function goBack() {
  router.back()
}

function sendInvite() {
  // 复制到剪贴板（带 fallback）
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(currentText.value).then(
      () => alert('已复制到剪贴板：\n' + currentText.value),
      () => fallbackCopy()
    )
  } else {
    fallbackCopy()
  }
}

function fallbackCopy() {
  // 旧浏览器 / HTTPS 失败 / 禁用权限 → 给出可见的文案让用户手动复制
  alert('请手动复制：\n\n' + currentText.value)
}

function onAction(type) {
  if (type === 'rephrase') {
    // mock：循环切语气（实际应调 LLM 改写同义变体）
    const idx = TONES.findIndex((t) => t.id === toneId.value)
    setTone(TONES[(idx + 1) % TONES.length].id)
  } else if (type === 'renegotiate') {
    router.back()
  } else if (type === 'cancel') {
    router.back()
  }
}

function onFollowUp(f) {
  // mock：弹出对应标签（实际应跳转业务路由）
  alert(`查看：${f.label}`)
}
</script>

<style lang="less" scoped>
.invite-page {
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

.inv-header {
  position: sticky;
  top: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  padding: 14rem 18rem;
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1rem solid #222;
}

.inv-back {
  font-size: 14rem;
  color: #ffd84a;
  cursor: pointer;
  margin-right: 12rem;
}

.inv-title {
  font-size: 16rem;
  font-weight: 600;
  flex: 1;
}

.inv-body {
  padding: 18rem;
}

.inv-context {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10rem;
  padding: 12rem 14rem;
  margin-bottom: 16rem;
}

.inv-context-row {
  display: flex;
  align-items: center;
  font-size: 12rem;
  padding: 3rem 0;
}

.inv-context-label {
  color: #888;
  width: 60rem;
}

.inv-context-value {
  color: #fff;
  flex: 1;
}

.inv-text-section {
  background: rgba(255, 216, 74, 0.06);
  border-left: 3rem solid #ffd84a;
  border-radius: 8rem;
  padding: 14rem;
  margin-bottom: 16rem;
}

.inv-text-label {
  font-size: 11rem;
  color: #888;
  margin-bottom: 6rem;
}

.inv-text-body {
  font-size: 16rem;
  color: #fff;
  line-height: 1.7;
  margin-bottom: 10rem;
}

.inv-text-disclaimer {
  font-size: 11rem;
  color: #888;
  font-style: italic;
}

.inv-tone-section {
  margin-bottom: 16rem;
}

.inv-tone-label {
  font-size: 12rem;
  color: #888;
  margin-bottom: 8rem;
}

.inv-tone-buttons {
  display: flex;
  gap: 8rem;
}

.inv-tone-btn {
  flex: 1;
  padding: 8rem 0;
  border-radius: 18rem;
  font-size: 13rem;
  border: 1rem solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #ffd84a;
    color: #1a1a1a;
    border-color: #ffd84a;
    font-weight: 600;
  }
}

.inv-safety {
  background: rgba(255, 100, 100, 0.06);
  border: 1rem solid rgba(255, 100, 100, 0.2);
  border-radius: 10rem;
  padding: 12rem 14rem;
  margin-bottom: 16rem;
}

.inv-safety-title {
  font-size: 12rem;
  color: #ff8b8b;
  font-weight: 600;
  margin-bottom: 6rem;
}

.inv-safety-list {
  list-style: disc;
  padding-left: 18rem;
  margin: 0;
}

.inv-safety-list li {
  font-size: 12rem;
  color: #ddd;
  line-height: 1.6;
  padding: 2rem 0;
}

.inv-followups {
  margin-bottom: 16rem;
}

.inv-followups-label {
  font-size: 12rem;
  color: #888;
  margin-bottom: 8rem;
}

.inv-followup-btn {
  display: block;
  width: 100%;
  padding: 10rem 14rem;
  border-radius: 10rem;
  font-size: 13rem;
  border: 1rem solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  cursor: pointer;
  text-align: left;
  margin-bottom: 6rem;

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
}

.inv-actions {
  display: flex;
  flex-direction: column;
  gap: 8rem;
  margin-top: 20rem;
  padding-bottom: 30rem;
}

.inv-btn {
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
}

.inv-btn-primary {
  background: linear-gradient(135deg, #ffd84a 0%, #ffb84a 100%);
  color: #1a1a1a;
  border: none;
  font-weight: 600;
}

.inv-btn-cancel {
  background: transparent;
  color: #999;
  border: none;
}
</style>
