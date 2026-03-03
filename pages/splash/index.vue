<template>
  <view class="splash-screen">
    <image class="background-image" src="/static/kaiping.jpg" mode="aspectFill"></image>
    <view class="overlay"></view>
    
    <view class="splash-content">
      <view class="footer-section">
        <text class="developer-info">开发人员：Skylark云雀</text>
        <text class="version-info">Version 1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 3秒后自动跳转到首页
  setTimeout(() => {
    uni.redirectTo({
      url: '/pages/home/index'
    })
  }, 3000)
})
</script>

<style lang="scss" scoped>
.splash-screen {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 100vh;
  padding: 80rpx 40rpx;
  z-index: 2;
  position: relative;
}

.footer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.developer-info {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
  margin-bottom: 16rpx;
  font-weight: 500;
}

.version-info {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
}
</style>
