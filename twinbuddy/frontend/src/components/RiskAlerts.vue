<template>
  <!--
    RiskAlerts 风险提示组件 (F5)
    依据：PRD §16 + docs/safety.md
  -->
  <div class="risk-alerts" :class="severity">
    <div class="risk-header">
      <span class="risk-icon">{{ severityIcon }}</span>
      <span class="risk-title">{{ title }}</span>
    </div>
    <ul v-if="alerts?.length" class="risk-list">
      <li v-for="(a, i) in alerts" :key="i" class="risk-item">{{ a }}</li>
    </ul>
    <div v-if="advice" class="risk-advice">💡 {{ advice }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '风险提示' },
  alerts: { type: Array, default: () => [] },
  advice: { type: String, default: '' },
  severity: {
    type: String,
    default: 'medium',
    validator: (v) => ['low', 'medium', 'high'].includes(v),
  },
})

const severityIcon = computed(() => {
  return { low: '💡', medium: '⚠', high: '🚨' }[props.severity] || '⚠'
})
</script>

<style lang="less" scoped>
.risk-alerts {
  background: rgba(255, 100, 100, 0.08);
  border: 1rem solid rgba(255, 100, 100, 0.2);
  border-radius: 8rem;
  padding: 10rem 12rem;
  margin: 8rem 0;

  &.low {
    background: rgba(92, 217, 122, 0.08);
    border-color: rgba(92, 217, 122, 0.2);

    .risk-title {
      color: #5cd97a;
    }
  }

  &.medium {
    background: rgba(255, 216, 74, 0.08);
    border-color: rgba(255, 216, 74, 0.2);

    .risk-title {
      color: #ffd84a;
    }
  }

  &.high {
    background: rgba(255, 60, 60, 0.12);
    border-color: rgba(255, 60, 60, 0.4);

    .risk-title {
      color: #ff6b6b;
    }
  }
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 6rem;
  margin-bottom: 6rem;
}

.risk-icon {
  font-size: 14rem;
}

.risk-title {
  font-size: 12rem;
  color: #ff8b8b;
  font-weight: 600;
}

.risk-list {
  list-style: disc;
  padding-left: 18rem;
  margin: 0;
}

.risk-item {
  font-size: 12rem;
  color: #ddd;
  line-height: 1.5;
  padding: 2rem 0;
}

.risk-advice {
  margin-top: 6rem;
  font-size: 11rem;
  color: #999;
  font-style: italic;
}
</style>
