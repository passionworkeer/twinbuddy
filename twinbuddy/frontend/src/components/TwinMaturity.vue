<template>
  <!--
    TwinMaturity Twin 成熟度角标 (F8)
    依据：PRD §12 + docs/component-designs.md §7
    轻量：可放卡片右上 / 单独页
    等级：novice (1 格) → intermediate (2 格) → advanced (3 格)
  -->
  <div class="twin-maturity" :class="level">
    <div class="tm-header">
      <div class="tm-title">你的 Twin</div>
      <div class="tm-dots">
        <span
          v-for="i in 3"
          :key="i"
          class="tm-dot"
          :class="{ filled: i <= currentLevel }"
        ></span>
      </div>
    </div>
    <div class="tm-body">
      <div class="tm-progress-row">
        <span class="tm-label">画像完整度</span>
        <span class="tm-value">{{ safePercent }}%</span>
      </div>
      <div class="tm-bar">
        <div class="tm-bar-fill" :style="{ width: safePercent + '%' }"></div>
      </div>
      <div class="tm-tip">{{ tipText }}</div>
    </div>
    <div class="tm-features">
      <div class="tm-feature" :class="{ active: currentLevel >= 1 }">
        <span class="tm-check">✓</span> 基础推荐
      </div>
      <div class="tm-feature" :class="{ active: currentLevel >= 2 }">
        <span class="tm-check">✓</span> 同频搭子
      </div>
      <div class="tm-feature" :class="{ active: currentLevel >= 3 }">
        <span class="tm-check">✓</span> 主动过滤风险
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: {
    type: String,
    default: 'novice',
    validator: (v) => ['novice', 'intermediate', 'advanced'].includes(v),
  },
  percent: {
    type: Number,
    default: 20,
    validator: (v) => v >= 0 && v <= 100,
  },
})

const LEVELS = { novice: 1, intermediate: 2, advanced: 3 }
const currentLevel = computed(() => LEVELS[props.level] || 1)
// percent 夹紧到 0-100，防止外部传 999 撑爆 UI
const safePercent = computed(() => Math.min(100, Math.max(0, props.percent)))

const TIP = {
  novice: '你的 Twin 刚加入 3 天，了解你 20%',
  intermediate: '你的 Twin 看了 20+ 内容 + 3 张行动卡',
  advanced: '你的 Twin 走过 1 次完整协商闭环',
}
const tipText = computed(() => TIP[props.level] || TIP.novice)
</script>

<style lang="less" scoped>
.twin-maturity {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10rem;
  padding: 12rem 14rem;
  color: #fff;
}

.tm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rem;
}

.tm-title {
  font-size: 13rem;
  font-weight: 600;
}

.tm-dots {
  display: flex;
  gap: 4rem;
}

.tm-dot {
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: #333;

  &.filled {
    background: #ffd84a;
  }
}

.tm-progress-row {
  display: flex;
  justify-content: space-between;
  font-size: 11rem;
  margin-bottom: 4rem;
}

.tm-label {
  color: #888;
}

.tm-value {
  color: #ffd84a;
  font-weight: 600;
}

.tm-bar {
  height: 6rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3rem;
  overflow: hidden;
  margin-bottom: 8rem;
}

.tm-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd84a 0%, #5cd97a 100%);
  border-radius: 3rem;
  transition: width 0.4s ease;
}

.tm-tip {
  font-size: 11rem;
  color: #999;
  font-style: italic;
  margin-bottom: 10rem;
}

.tm-features {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.tm-feature {
  font-size: 12rem;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6rem;

  &.active {
    color: #5cd97a;
  }
}

.tm-check {
  font-weight: bold;
}
</style>
