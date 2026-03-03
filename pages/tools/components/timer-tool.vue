<template>
  <view class="timer-tool">
    <view class="tool-header">
      <text class="tool-title">⏱️ 计时器</text>
      <text class="tool-hint">正计时 / 倒计时</text>
    </view>
    
    <view class="mode-tabs">
      <view 
        class="mode-tab" 
        :class="{ active: timerMode === 'countup' }"
        @click="switchMode('countup')"
      >
        <text>正计时</text>
      </view>
      <view 
        class="mode-tab" 
        :class="{ active: timerMode === 'countdown' }"
        @click="switchMode('countdown')"
      >
        <text>倒计时</text>
      </view>
    </view>
    
    <view class="time-display">
      <text class="time-value" :class="{ warning: isWarning }">{{ formattedTime }}</text>
    </view>
    
    <view class="countdown-setting" v-if="timerMode === 'countdown' && !isRunning">
      <view class="time-picker">
        <view class="picker-item">
          <view class="picker-btn" @click="adjustTime('minutes', 1)">+</view>
          <text class="picker-value">{{ setMinutes }}</text>
          <view class="picker-btn" @click="adjustTime('minutes', -1)">-</view>
          <text class="picker-label">分</text>
        </view>
        <text class="picker-separator">:</text>
        <view class="picker-item">
          <view class="picker-btn" @click="adjustTime('seconds', 10)">+</view>
          <text class="picker-value">{{ setSeconds }}</text>
          <view class="picker-btn" @click="adjustTime('seconds', -10)">-</view>
          <text class="picker-label">秒</text>
        </view>
      </view>
    </view>
    
    <view class="progress-ring" v-if="timerMode === 'countdown' && isRunning">
      <view class="ring-inner">
        <text class="ring-percent">{{ progressPercent }}%</text>
      </view>
    </view>
    
    <view class="control-buttons">
      <button 
        class="control-btn primary" 
        @click="toggleTimer"
        v-if="!isFinished"
      >
        {{ isRunning ? '暂停' : '开始' }}
      </button>
      <button 
        class="control-btn primary finished" 
        @click="resetTimer"
        v-else
      >
        重新开始
      </button>
      <button class="control-btn secondary" @click="resetTimer">
        重置
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const timerMode = ref('countup')
const isRunning = ref(false)
const isFinished = ref(false)
const currentTime = ref(0)
const setMinutes = ref(5)
const setSeconds = ref(0)
const totalTime = ref(0)
let timer = null

const formattedTime = computed(() => {
  const totalSeconds = timerMode.value === 'countdown' 
    ? currentTime.value 
    : currentTime.value
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  if (totalTime.value === 0) return 0
  return Math.round((currentTime.value / totalTime.value) * 100)
})

const isWarning = computed(() => {
  return timerMode.value === 'countdown' && currentTime.value <= 10 && currentTime.value > 0
})

const switchMode = (mode) => {
  if (isRunning.value) return
  timerMode.value = mode
  resetTimer()
}

const adjustTime = (unit, delta) => {
  if (isRunning.value) return
  
  if (unit === 'minutes') {
    setMinutes.value = Math.max(0, Math.min(99, setMinutes.value + delta))
  } else {
    setSeconds.value = Math.max(0, Math.min(59, setSeconds.value + delta))
  }
}

const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  if (timerMode.value === 'countdown') {
    if (currentTime.value === 0) {
      totalTime.value = setMinutes.value * 60 + setSeconds.value
      currentTime.value = totalTime.value
    }
    
    if (currentTime.value === 0) {
      uni.showToast({
        title: '请设置时间',
        icon: 'none'
      })
      return
    }
  }
  
  isRunning.value = true
  isFinished.value = false
  
  timer = setInterval(() => {
    if (timerMode.value === 'countup') {
      currentTime.value++
    } else {
      currentTime.value--
      
      if (currentTime.value <= 10 && currentTime.value > 0) {
        uni.vibrateShort({
          type: 'light'
        })
      }
      
      if (currentTime.value <= 0) {
        finishTimer()
      }
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const finishTimer = () => {
  pauseTimer()
  isFinished.value = true
  
  uni.vibrateLong()
  
  uni.showModal({
    title: '时间到！',
    content: '计时结束',
    showCancel: false,
    confirmText: '确定'
  })
}

const resetTimer = () => {
  pauseTimer()
  currentTime.value = 0
  totalTime.value = 0
  isFinished.value = false
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.timer-tool {
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
    color: #4facfe;
    font-weight: 600;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  }
}

.time-display {
  text-align: center;
  margin-bottom: 40rpx;
}

.time-value {
  font-size: 96rpx;
  font-weight: bold;
  color: #333333;
  font-family: 'Courier New', monospace;
  
  &.warning {
    color: #ff6b6b;
    animation: blink 0.5s infinite;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.countdown-setting {
  margin-bottom: 40rpx;
}

.time-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20rpx;
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.picker-btn {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  
  &:active {
    opacity: 0.8;
  }
}

.picker-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
}

.picker-label {
  font-size: 24rpx;
  color: #999999;
}

.picker-separator {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-top: -40rpx;
}

.progress-ring {
  width: 200rpx;
  height: 200rpx;
  margin: 0 auto 40rpx;
  border-radius: 50%;
  background: conic-gradient(
    #4facfe 0deg,
    #00f2fe calc(v-bind(progressPercent) * 3.6deg),
    #f0f0f0 calc(v-bind(progressPercent) * 3.6deg)
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-inner {
  width: 160rpx;
  height: 160rpx;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-size: 32rpx;
  font-weight: bold;
  color: #4facfe;
}

.control-buttons {
  display: flex;
  gap: 20rpx;
}

.control-btn {
  flex: 1;
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  text-align: center;
  
  &.primary {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #ffffff;
    
    &.finished {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
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
</style>
