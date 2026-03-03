<template>
  <view class="home-page">
    <view class="header">
      <text class="title">好友派对助手</text>
      <text class="subtitle">让每一次聚会都精彩</text>
    </view>
    
    <view class="menu-grid">
      <view 
        class="menu-item" 
        v-for="item in menuList" 
        :key="item.id"
        @click="navigateTo(item.path)"
      >
        <view class="menu-icon" :style="{ background: item.gradient }">
          <text class="icon-text">{{ item.icon }}</text>
        </view>
        <text class="menu-title">{{ item.title }}</text>
        <text class="menu-desc">{{ item.desc }}</text>
      </view>
    </view>
    
    <view class="contact-section">
      <view class="contact-card">
        <view class="contact-header">
          <text class="contact-icon">📧</text>
          <text class="contact-title">联系开发人员</text>
        </view>
        
        <view class="contact-info">
          <view class="info-item">
            <text class="info-label">开发人员：</text>
            <text class="info-value">Skylark云雀</text>
          </view>
          <view class="info-item">
            <text class="info-label">联系邮箱：</text>
            <text class="info-value email" @click="copyEmail">864764135@qq.com</text>
          </view>
        </view>
        
        <view class="contact-tips">
          <text class="tips-text">如果在使用该工具过程中遇到任何问题和BUG，欢迎反馈给开发人员，您的积极反馈将给项目带来有益的发展！</text>
        </view>
      </view>
    </view>
    
    <view class="footer">
      <text class="footer-text">和朋友一起，创造美好回忆</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const menuList = ref([
  {
    id: 1,
    title: '桌游助手',
    desc: '狼人杀/阿瓦隆/剧本杀',
    icon: '🎲',
    path: '/pages/boardgame/index',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    title: '派对工具箱',
    desc: '聚会小游戏',
    icon: '🎉',
    path: '/pages/tools/index',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    title: '好友排名',
    desc: '记录游戏战绩',
    icon: '🏆',
    path: '/pages/rank/room',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 4,
    title: '匿名吐槽',
    desc: '匿名聊天室',
    icon: '💬',
    path: '/pages/chat/anonymous',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
])

const navigateTo = (path) => {
  uni.navigateTo({
    url: path
  })
}

const copyEmail = () => {
  uni.setClipboardData({
    data: '864764135@qq.com',
    success: () => {
      uni.showToast({ title: '邮箱已复制', icon: 'success' })
    }
  })
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding: 40rpx 30rpx;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
}

.header {
  text-align: center;
  padding: 60rpx 0 80rpx;
  
  .title {
    display: block;
    font-size: 72rpx;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: #999999;
    margin-top: 16rpx;
  }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.menu-item {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  }
}

.menu-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
  
  .icon-text {
    font-size: 48rpx;
  }
}

.menu-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8rpx;
}

.menu-desc {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.contact-section {
  margin-bottom: 40rpx;
}

.contact-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.contact-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.contact-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.contact-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.contact-info {
  margin-bottom: 24rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  min-width: 140rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  
  &.email {
    color: #667eea;
    text-decoration: underline;
  }
}

.contact-tips {
  background-color: #f8f9ff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.tips-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.6;
}

.footer {
  text-align: center;
  padding: 60rpx 0 40rpx;
  
  .footer-text {
    font-size: 24rpx;
    color: #cccccc;
  }
}
</style>
