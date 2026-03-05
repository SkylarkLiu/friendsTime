<template>
  <view class="dice-tool">
    <view class="tool-header">
      <text class="tool-title">🎲 摇骰子</text>
      <text class="tool-hint">选择骰子数量，摇出你的命运</text>
    </view>
    
    <view class="dice-count-selector">
      <text class="selector-label">骰子数量</text>
      <view class="selector-btns">
        <view 
          class="count-btn" 
          :class="{ active: diceCount === i }"
          v-for="i in 6"
          :key="i"
          @click="diceCount = i"
        >{{ i }}</view>
      </view>
    </view>
    
    <view class="dice-display">
      <view 
        class="dice" 
        v-for="(dice, index) in diceList" 
        :key="index"
        :class="{ rolling: dice.isRolling }"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <view class="dice-face">
          <view 
            class="dot" 
            v-for="dotPos in 9" 
            :key="dotPos"
            :class="{ visible: isDotVisible(dice.value, dotPos) }"
          ></view>
        </view>
      </view>
    </view>
    
    <view class="result-display" v-if="showResult && !isRolling">
      <text class="result-label">点数总和</text>
      <text class="result-value">{{ totalValue }}</text>
      <view class="detail-values">
        <text class="detail-item" v-for="(dice, index) in diceList" :key="index">
          骰子{{ index + 1 }}: {{ dice.value }}
        </text>
      </view>
    </view>
    
    <button class="roll-btn" @click="rollDice" :disabled="isRolling">
      {{ isRolling ? '摇动中...' : '🎲 摇骰子' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const diceCount = ref(1)
const isRolling = ref(false)
const showResult = ref(false)

const diceList = ref([
  { value: 1, isRolling: false },
  { value: 1, isRolling: false },
  { value: 1, isRolling: false },
  { value: 1, isRolling: false },
  { value: 1, isRolling: false },
  { value: 1, isRolling: false }
])

const totalValue = computed(() => {
  let total = 0
  for (let i = 0; i < diceCount.value; i++) {
    total += diceList.value[i].value
  }
  return total
})

const dotPatterns = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
}

const isDotVisible = (value, position) => {
  return dotPatterns[value] && dotPatterns[value].includes(position)
}

const rollDice = () => {
  if (isRolling.value) return
  
  isRolling.value = true
  showResult.value = false
  
  for (let i = 0; i < 6; i++) {
    diceList.value[i].isRolling = i < diceCount.value
  }
  
  const rollDurations = []
  for (let i = 0; i < diceCount.value; i++) {
    rollDurations.push(800 + Math.random() * 600 + i * 150)
  }
  
  const intervals = []
  for (let i = 0; i < diceCount.value; i++) {
    const interval = setInterval(() => {
      diceList.value[i].value = Math.floor(Math.random() * 6) + 1
    }, 50)
    intervals.push(interval)
  }
  
  for (let i = 0; i < diceCount.value; i++) {
    setTimeout(() => {
      clearInterval(intervals[i])
      diceList.value[i].isRolling = false
      diceList.value[i].value = Math.floor(Math.random() * 6) + 1
      
      uni.vibrateShort({
        type: 'medium'
      })
      
      if (i === diceCount.value - 1) {
        isRolling.value = false
        showResult.value = true
      }
    }, rollDurations[i])
  }
}

watch(diceCount, () => {
  showResult.value = false
})
</script>

<style lang="scss" scoped>
.dice-tool {
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

.dice-count-selector {
  margin-bottom: 40rpx;
}

.selector-label {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}

.selector-btns {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.count-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  border: 2rpx solid #e0e0e0;
  
  &.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 4rpx 12rpx rgba(240, 147, 251, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.dice-display {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20rpx;
  min-height: 160rpx;
  margin-bottom: 30rpx;
  padding: 20rpx;
}

.dice {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 6rpx 12rpx rgba(0, 0, 0, 0.1),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.9);
  
  &.rolling {
    animation: diceRoll 0.15s ease-in-out infinite;
  }
}

@keyframes diceRoll {
  0% { 
    transform: rotate(0deg) scale(1);
    box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.1);
  }
  25% { 
    transform: rotate(-15deg) scale(1.05);
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.15);
  }
  50% { 
    transform: rotate(0deg) scale(1);
    box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.1);
  }
  75% { 
    transform: rotate(15deg) scale(1.05);
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.15);
  }
  100% { 
    transform: rotate(0deg) scale(1);
    box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.1);
  }
}

.dice-face {
  width: 80rpx;
  height: 80rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2rpx;
  padding: 8rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.1s, transform 0.1s;
  
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  &:nth-child(1) { grid-area: 1 / 1; justify-self: center; align-self: center; }
  &:nth-child(2) { grid-area: 1 / 2; justify-self: center; align-self: center; }
  &:nth-child(3) { grid-area: 1 / 3; justify-self: center; align-self: center; }
  &:nth-child(4) { grid-area: 2 / 1; justify-self: center; align-self: center; }
  &:nth-child(5) { grid-area: 2 / 2; justify-self: center; align-self: center; }
  &:nth-child(6) { grid-area: 2 / 3; justify-self: center; align-self: center; }
  &:nth-child(7) { grid-area: 3 / 1; justify-self: center; align-self: center; }
  &:nth-child(8) { grid-area: 3 / 2; justify-self: center; align-self: center; }
  &:nth-child(9) { grid-area: 3 / 3; justify-self: center; align-self: center; }
}

.result-display {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #fff5f8 0%, #fff0f5 100%);
  border-radius: 16rpx;
  border: 2rpx solid rgba(240, 147, 251, 0.2);
}

.result-label {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.result-value {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12rpx;
}

.detail-values {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12rpx;
}

.detail-item {
  font-size: 22rpx;
  color: #666666;
  background: rgba(255, 255, 255, 0.8);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.roll-btn {
  width: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 6rpx 20rpx rgba(240, 147, 251, 0.4);
  
  &[disabled] {
    opacity: 0.6;
    box-shadow: none;
  }
  
  &:active:not([disabled]) {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
</style>
