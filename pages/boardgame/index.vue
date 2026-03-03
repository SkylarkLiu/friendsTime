<template>
  <view class="boardgame-page">
    <view class="header">
      <text class="title">桌游助手</text>
      <text class="subtitle">选择游戏类型</text>
    </view>
    
    <view class="game-list">
      <view 
        class="game-item" 
        v-for="game in gameList" 
        :key="game.id"
        @click="navigateTo(game.path)"
      >
        <view class="game-icon" :style="{ background: game.gradient }">
          <text class="icon-text">{{ game.icon }}</text>
        </view>
        <view class="game-info">
          <text class="game-name">{{ game.name }}</text>
          <text class="game-desc">{{ game.desc }}</text>
        </view>
        <text class="game-arrow">›</text>
      </view>
    </view>
    
    <view class="coming-soon">
      <text class="coming-title">即将上线</text>
      <view class="coming-list">
        <view class="coming-item" v-for="item in comingGames" :key="item.id">
          <text class="coming-icon">{{ item.icon }}</text>
          <text class="coming-name">{{ item.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const gameList = ref([
  {
    id: 1,
    name: '狼人杀',
    desc: '随机发牌、角色分配、法官视角',
    icon: '🐺',
    path: '/pages/boardgame/werewolf-room',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    name: '阿瓦隆',
    desc: '组队投票、任务执行、阵营对抗',
    icon: '⚔️',
    path: '/pages/boardgame/avalon-room',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
])

const comingGames = ref([
  { id: 3, name: '剧本杀', icon: '📜' },
  { id: 4, name: '谁是卧底', icon: '🎭' },
  { id: 5, name: '你画我猜', icon: '🎨' }
])

const navigateTo = (path) => {
  uni.navigateTo({
    url: path
  })
}
</script>

<style lang="scss" scoped>
.boardgame-page {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f8f8f8;
}

.header {
  text-align: center;
  padding: 40rpx 0 50rpx;
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 12rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: #999999;
  }
}

.game-list {
  margin-bottom: 40rpx;
}

.game-item {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.game-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  
  .icon-text {
    font-size: 48rpx;
  }
}

.game-info {
  flex: 1;
  
  .game-name {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 8rpx;
  }
  
  .game-desc {
    display: block;
    font-size: 24rpx;
    color: #999999;
  }
}

.game-arrow {
  font-size: 40rpx;
  color: #cccccc;
  font-weight: 300;
}

.coming-soon {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.coming-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #999999;
  margin-bottom: 24rpx;
}

.coming-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.coming-item {
  display: flex;
  align-items: center;
  background-color: #f8f9ff;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  
  .coming-icon {
    font-size: 28rpx;
    margin-right: 12rpx;
  }
  
  .coming-name {
    font-size: 26rpx;
    color: #666666;
  }
}
</style>
