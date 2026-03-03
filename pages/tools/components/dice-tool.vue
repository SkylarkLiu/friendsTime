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
          :class="{ active: diceCount === 1 }"
          @click="diceCount = 1"
        >1</view>
        <view 
          class="count-btn" 
          :class="{ active: diceCount === 2 }"
          @click="diceCount = 2"
        >2</view>
        <view 
          class="count-btn" 
          :class="{ active: diceCount === 3 }"
          @click="diceCount = 3"
        >3</view>
      </view>
    </view>
    
    <view class="dice-display">
      <view 
        class="dice" 
        v-for="(value, index) in diceValues" 
        :key="index"
        :class="{ rolling: isRolling }"
      >
        <view class="dice-face">
          <view class="dot" v-for="dot in value" :key="dot" :class="'dot-' + dot"></view>
        </view>
      </view>
    </view>
    
    <view class="result-display" v-if="showResult">
      <text class="result-label">点数总和</text>
      <text class="result-value">{{ totalValue }}</text>
    </view>
    
    <button class="roll-btn" @click="rollDice" :disabled="isRolling">
      {{ isRolling ? '摇动中...' : '摇骰子' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const diceCount = ref(1)
const diceValues = ref([1])
const isRolling = ref(false)
const showResult = ref(false)

const totalValue = computed(() => {
  return diceValues.value.reduce((sum, val) => sum + val, 0)
})

const getDotPositions = (value) => {
  const positions = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  }
  return positions[value] || []
}

const rollDice = () => {
  if (isRolling.value) return
  
  isRolling.value = true
  showResult.value = false
  
  let rollCount = 0
  const maxRolls = 15
  const rollInterval = setInterval(() => {
    diceValues.value = Array.from({ length: diceCount.value }, () => 
      Math.floor(Math.random() * 6) + 1
    )
    rollCount++
    
    if (rollCount >= maxRolls) {
      clearInterval(rollInterval)
      isRolling.value = false
      showResult.value = true
      
      uni.vibrateShort({
        type: 'medium'
      })
    }
  }, 80)
}
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
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40rpx;
}

.selector-label {
  font-size: 28rpx;
  color: #666666;
  margin-right: 20rpx;
}

.selector-btns {
  display: flex;
  gap: 16rpx;
}

.count-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  
  &.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #ffffff;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.dice-display {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  min-height: 200rpx;
  margin-bottom: 30rpx;
}

.dice {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8rpx 16rpx rgba(0, 0, 0, 0.1),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.8);
  transition: transform 0.1s;
  
  &.rolling {
    animation: shake 0.1s infinite;
  }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.dice-face {
  width: 100rpx;
  height: 100rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4rpx;
  padding: 10rpx;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  visibility: hidden;
  
  &:nth-child(1) { grid-area: 1 / 1; }
  &:nth-child(2) { grid-area: 1 / 2; }
  &:nth-child(3) { grid-area: 1 / 3; }
  &:nth-child(4) { grid-area: 2 / 1; }
  &:nth-child(5) { grid-area: 2 / 2; }
  &:nth-child(6) { grid-area: 2 / 3; }
  &:nth-child(7) { grid-area: 3 / 1; }
  &:nth-child(8) { grid-area: 3 / 2; }
  &:nth-child(9) { grid-area: 3 / 3; }
}

.result-display {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f8f9ff;
  border-radius: 16rpx;
}

.result-label {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.result-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #f5576c;
}

.roll-btn {
  width: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  text-align: center;
  
  &[disabled] {
    opacity: 0.6;
  }
  
  &:active {
    opacity: 0.8;
  }
}
</style>
