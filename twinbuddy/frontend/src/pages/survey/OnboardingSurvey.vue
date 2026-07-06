<template>
  <!--
    OnboardingSurvey 30 秒问卷 (F7)
    依据：PRD §12 + docs/component-designs.md §6
    前置：用户累计看过 ≥ 10 条 feed 且无 persona
    7 题，每题 3 选项
  -->
  <div class="survey-page">
    <header class="sv-header">
      <div class="sv-back" @click="goBack">←</div>
      <div class="sv-progress">第 {{ state.step + 1 }} / {{ QUESTIONS.length }} 题</div>
    </header>

    <div class="sv-body">
      <transition name="sv-fade" mode="out-in">
        <div :key="state.step" class="sv-question">
          <h2 class="sv-q-text">{{ currentQ.text }}</h2>
          <div class="sv-options">
            <button
              v-for="(opt, i) in currentQ.options"
              :key="i"
              class="sv-option"
              :class="{ active: state.answers[state.step] === opt.value }"
              @click="select(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <footer class="sv-footer">
      <button class="sv-btn sv-btn-ghost" @click="goBack" v-if="state.step > 0">上一步</button>
      <button class="sv-btn sv-btn-primary" :disabled="!canNext" @click="next">
        {{ state.step === QUESTIONS.length - 1 ? '完成' : '下一题' }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const QUESTIONS = [
  {
    text: '你今天最想做什么？',
    options: [
      { value: 'rest', label: '休息 / 躺平' },
      { value: 'explore', label: '探索 / 出去走走' },
      { value: 'achieve', label: '完成目标' },
    ],
  },
  {
    text: '你和陌生人最舒服的相处方式？',
    options: [
      { value: 'one_on_one', label: '1v1 私聊' },
      { value: 'group', label: '多人局' },
      { value: 'no_person', label: '不需要人' },
    ],
  },
  {
    text: '你的旅行节奏？',
    options: [
      { value: 'special_force', label: '特种兵 / 一天跑 5 个景点' },
      { value: 'slow', label: '慢节奏 / 一个地方呆一天' },
      { value: 'citywalk', label: '城市漫游' },
    ],
  },
  {
    text: '你的早茶时间？',
    options: [
      { value: 'before_9', label: '9 点前' },
      { value: '9_to_11', label: '9-11 点' },
      { value: 'after_11', label: '11 点后 / 不吃早茶' },
    ],
  },
  {
    text: '你的消费偏好？',
    options: [
      { value: 'value', label: '性价比' },
      { value: 'experience', label: '体验优先' },
      { value: 'look', label: '颜值优先' },
    ],
  },
  {
    text: '你的周末状态？',
    options: [
      { value: 'often_out', label: '经常出逃' },
      { value: 'sometimes_out', label: '偶尔出去' },
      { value: 'stay_home', label: '主要宅家' },
    ],
  },
  {
    text: '你希望 AI 推你做什么？',
    options: [
      { value: 'plan', label: '给方案' },
      { value: 'buddy', label: '给搭子' },
      { value: 'both', label: '两者都要' },
    ],
  },
]

const state = reactive({
  step: 0,
  answers: new Array(QUESTIONS.length).fill(null),
  completed: false,
})

const currentQ = computed(() => QUESTIONS[state.step])
const canNext = computed(() => state.answers[state.step] != null)

function select(value) {
  // 不可变：map 替换
  state.answers = state.answers.map((v, i) => (i === state.step ? value : v))
}

function next() {
  if (state.step < QUESTIONS.length - 1) {
    state.step++
  } else {
    complete()
  }
}

function complete() {
  const persona = {
    pace: state.answers[0],
    social: state.answers[1],
    trip_pace: state.answers[2],
    morning: state.answers[3],
    consume: state.answers[4],
    weekend: state.answers[5],
    ai_role: state.answers[6],
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem('v2.persona.exists', 'true')
    localStorage.setItem('v2.persona', JSON.stringify(persona))
  } catch (e) {
    // 隐私模式 / 配额满 → 不阻塞流程，用户后续可能会被再次邀请
    if (typeof console !== 'undefined') {
      console.warn('[survey] persona persist failed', e)
    }
  }
  state.completed = true
  router.push('/feed')
}

function goBack() {
  if (state.step > 0) state.step--
  else router.back()
}
</script>

<style lang="less" scoped>
.survey-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  color: #fff;
  z-index: 9998;
  display: flex;
  flex-direction: column;
}

.sv-header {
  display: flex;
  align-items: center;
  padding: 14rem 18rem;
  border-bottom: 1rem solid #222;
}

.sv-back {
  font-size: 18rem;
  color: #ffd84a;
  cursor: pointer;
  margin-right: 12rem;
}

.sv-progress {
  font-size: 12rem;
  color: #888;
  flex: 1;
  text-align: right;
}

.sv-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rem 24rem;
}

.sv-question {
  width: 100%;
  max-width: 480rem;
}

.sv-q-text {
  font-size: 22rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 24rem;
  color: #fff;
}

.sv-options {
  display: flex;
  flex-direction: column;
  gap: 12rem;
}

.sv-option {
  padding: 14rem 18rem;
  border-radius: 12rem;
  font-size: 14rem;
  border: 2rem solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &.active {
    border-color: #ffd84a;
    background: rgba(255, 216, 74, 0.1);
    color: #ffd84a;
  }

  &:active {
    transform: scale(0.98);
  }
}

.sv-footer {
  display: flex;
  gap: 12rem;
  padding: 16rem 24rem 24rem;
  border-top: 1rem solid #222;
}

.sv-btn {
  flex: 1;
  padding: 14rem 0;
  border-radius: 24rem;
  font-size: 14rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

.sv-btn-primary {
  background: linear-gradient(135deg, #ffd84a 0%, #ffb84a 100%);
  color: #1a1a1a;
  font-weight: 600;
}

.sv-btn-ghost {
  background: transparent;
  color: #888;
  border: 1rem solid rgba(255, 255, 255, 0.15);
  flex: 0.5;
}

.sv-fade-enter-active,
.sv-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.sv-fade-enter-from {
  opacity: 0;
  transform: translateX(20rem);
}

.sv-fade-leave-to {
  opacity: 0;
  transform: translateX(-20rem);
}
</style>
