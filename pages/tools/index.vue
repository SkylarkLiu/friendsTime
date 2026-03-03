<template>
  <view class="tools-page">
    <view class="tools-grid">
      <view 
        class="tool-card" 
        v-for="tool in toolsList" 
        :key="tool.id"
        @click="openTool(tool)"
      >
        <view class="tool-icon" :style="{ background: tool.gradient }">
          <text class="icon-text">{{ tool.icon }}</text>
        </view>
        <view class="tool-info">
          <text class="tool-name">{{ tool.name }}</text>
          <text class="tool-desc">{{ tool.description }}</text>
        </view>
      </view>
    </view>
    
    <view class="tool-modal" v-if="currentTool" @click="closeTool">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentTool.name }}</text>
          <view class="close-btn" @click="closeTool">
            <text>✕</text>
          </view>
        </view>
        <view class="modal-body">
          <dice-tool v-if="currentTool.id === 'dice'" />
          <timer-tool v-if="currentTool.id === 'timer'" />
          <truth-dare-tool v-if="currentTool.id === 'truth_dare'" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { getAllTools } from './config'
import DiceTool from './components/dice-tool.vue'
import TimerTool from './components/timer-tool.vue'
import TruthDareTool from './components/truth-dare-tool.vue'

const toolsList = ref(getAllTools())
const currentTool = ref(null)

const openTool = (tool) => {
  currentTool.value = tool
}

const closeTool = () => {
  currentTool.value = null
}
</script>

<style lang="scss" scoped>
.tools-page {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.tool-card {
  width: calc(50% - 10rpx);
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.tool-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  
  .icon-text {
    font-size: 40rpx;
  }
}

.tool-info {
  flex: 1;
}

.tool-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6rpx;
}

.tool-desc {
  display: block;
  font-size: 22rpx;
  color: #999999;
}

.tool-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.modal-content {
  width: 100%;
  max-height: 90vh;
  background-color: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 50%;
  
  text {
    font-size: 28rpx;
    color: #666666;
  }
  
  &:active {
    background-color: #eeeeee;
  }
}

.modal-body {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
