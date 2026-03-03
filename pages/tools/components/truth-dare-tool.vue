<template>
  <view class="truth-dare-tool">
    <view class="tool-header">
      <text class="tool-title">💬 真心话大冒险</text>
      <text class="tool-hint">随机抽取，挑战你的勇气</text>
    </view>
    
    <view class="mode-tabs">
      <view 
        class="mode-tab" 
        :class="{ active: currentMode === 'truth' }"
        @click="switchMode('truth')"
      >
        <text>真心话</text>
      </view>
      <view 
        class="mode-tab" 
        :class="{ active: currentMode === 'dare' }"
        @click="switchMode('dare')"
      >
        <text>大冒险</text>
      </view>
    </view>
    
    <view class="question-display">
      <view class="question-card" :class="{ flipped: showQuestion }">
        <view class="card-front">
          <text class="card-icon">{{ currentMode === 'truth' ? '🤔' : '🎯' }}</text>
          <text class="card-text">点击下方按钮抽取</text>
        </view>
        <view class="card-back">
          <text class="question-text">{{ currentQuestion }}</text>
        </view>
      </view>
    </view>
    
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-label">已抽取</text>
        <text class="stat-value">{{ usedCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">剩余</text>
        <text class="stat-value">{{ remainingCount }}</text>
      </view>
    </view>
    
    <view class="action-buttons">
      <button class="action-btn primary" @click="drawQuestion">
        {{ showQuestion ? '换一个' : '随机抽取' }}
      </button>
      <button class="action-btn secondary" @click="resetQuestions">
        重置题库
      </button>
    </view>
    
    <view class="history-section" v-if="history.length > 0">
      <view class="history-header" @click="showHistory = !showHistory">
        <text class="history-title">历史记录</text>
        <text class="history-toggle">{{ showHistory ? '收起' : '展开' }}</text>
      </view>
      <view class="history-list" v-if="showHistory">
        <view class="history-item" v-for="(item, index) in history" :key="index">
          <text class="history-mode">{{ item.mode === 'truth' ? '真心话' : '大冒险' }}</text>
          <text class="history-question">{{ item.question }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentMode = ref('truth')
const currentQuestion = ref('')
const showQuestion = ref(false)
const showHistory = ref(false)
const questions = ref({ truth: [], dare: [] })
const usedQuestions = ref({ truth: new Set(), dare: new Set() })
const history = ref([])

const usedCount = computed(() => usedQuestions.value[currentMode.value].size)
const remainingCount = computed(() => {
  const total = questions.value[currentMode.value]?.length || 0
  return total - usedCount.value
})

const loadQuestions = async () => {
  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: '/static/data/questions.json',
        success: (response) => resolve(response.data),
        fail: reject
      })
    })
    questions.value = res
  } catch (e) {
    questions.value = {
      truth: [
        '你最尴尬的经历是什么？',
        '你有什么不为人知的秘密？',
        '你最近一次哭是什么时候？'
      ],
      dare: [
        '模仿一个动物叫三声',
        '做十个俯卧撑',
        '大声唱一首歌'
      ]
    }
  }
}

const switchMode = (mode) => {
  currentMode.value = mode
  showQuestion.value = false
  currentQuestion.value = ''
}

const drawQuestion = () => {
  const modeQuestions = questions.value[currentMode.value]
  const used = usedQuestions.value[currentMode.value]
  
  const availableQuestions = modeQuestions.filter((_, index) => !used.has(index))
  
  if (availableQuestions.length === 0) {
    uni.showToast({
      title: '题库已用完，请重置',
      icon: 'none'
    })
    return
  }
  
  const randomIndex = Math.floor(Math.random() * availableQuestions.length)
  const selectedQuestion = availableQuestions[randomIndex]
  const originalIndex = modeQuestions.indexOf(selectedQuestion)
  
  used.add(originalIndex)
  currentQuestion.value = selectedQuestion
  showQuestion.value = true
  
  history.value.unshift({
    mode: currentMode.value,
    question: selectedQuestion
  })
  
  if (history.value.length > 20) {
    history.value.pop()
  }
  
  uni.vibrateShort({
    type: 'light'
  })
}

const resetQuestions = () => {
  usedQuestions.value = { truth: new Set(), dare: new Set() }
  history.value = []
  showQuestion.value = false
  currentQuestion.value = ''
  
  uni.showToast({
    title: '题库已重置',
    icon: 'success'
  })
}

onMounted(() => {
  loadQuestions()
})
</script>

<style lang="scss" scoped>
.truth-dare-tool {
  padding: 30rpx;
}

.tool-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.tool-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 10rpx;
}

.tool-hint {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.mode-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 40rpx;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #666666;
  
  &.active {
    background-color: #ffffff;
    color: #fa709a;
    font-weight: 600;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  }
}

.question-display {
  min-height: 300rpx;
  margin-bottom: 30rpx;
  perspective: 1000rpx;
}

.question-card {
  width: 100%;
  min-height: 300rpx;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  
  &.flipped {
    transform: rotateY(180deg);
  }
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  min-height: 300rpx;
  backface-visibility: hidden;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.card-front {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #ffffff;
}

.card-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.card-text {
  font-size: 32rpx;
  opacity: 0.9;
}

.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: rotateY(180deg);
  color: #ffffff;
}

.question-text {
  font-size: 32rpx;
  line-height: 1.6;
  text-align: center;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f8f9ff;
  border-radius: 16rpx;
}

.stat-item {
  text-align: center;
  
  .stat-label {
    display: block;
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 8rpx;
  }
  
  .stat-value {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #fa709a;
  }
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.action-btn {
  flex: 1;
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  text-align: center;
  
  &.primary {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: #ffffff;
  }
  
  &.secondary {
    background-color: #ffffff;
    color: #666666;
    border: 2rpx solid #dddddd;
  }
  
  &:active {
    opacity: 0.8;
  }
}

.history-section {
  background-color: #f8f9ff;
  border-radius: 16rpx;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  
  &:active {
    background-color: #f0f2ff;
  }
}

.history-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.history-toggle {
  font-size: 24rpx;
  color: #999999;
}

.history-list {
  padding: 0 24rpx 24rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.history-item {
  padding: 16rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.history-mode {
  display: inline-block;
  font-size: 22rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  margin-bottom: 8rpx;
}

.history-question {
  display: block;
  font-size: 26rpx;
  color: #666666;
  line-height: 1.4;
}
</style>
