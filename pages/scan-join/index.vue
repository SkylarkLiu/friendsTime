<template>
  <view class="scan-join-page">
    <view class="page-header">
      <text class="page-title">扫码加入房间</text>
      <text class="page-desc">扫描房主分享的二维码加入房间</text>
    </view>
    
    <view class="scan-section">
      <button class="scan-btn" @click="scanQRCode">
        <text class="scan-icon">📷</text>
        <text class="scan-text">扫描二维码</text>
      </button>
    </view>
    
    <view class="divider">
      <view class="divider-line"></view>
      <text class="divider-text">或手动输入</text>
      <view class="divider-line"></view>
    </view>
    
    <view class="manual-section">
      <view class="input-group">
        <text class="input-label">房间号</text>
        <input 
          class="input-field" 
          v-model="roomId" 
          placeholder="请输入6位房间号"
          type="number"
          maxlength="6"
        />
      </view>
      
      <view class="input-group">
        <text class="input-label">服务器地址</text>
        <input 
          class="input-field" 
          v-model="serverUrl" 
          placeholder="例如：http://192.168.1.100:3000"
        />
      </view>
      
      <button class="join-btn" @click="showJoinModal" :disabled="!roomId || roomId.length !== 6">
        加入房间
      </button>
    </view>
    
    <view class="modal" v-if="showPlayerNameModal" @click="closePlayerNameModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">输入玩家名称</text>
        <input 
          class="modal-input" 
          v-model="playerName" 
          placeholder="请输入你的昵称"
          maxlength="10"
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="closePlayerNameModal">取消</button>
          <button class="modal-btn confirm" @click="confirmJoin" :disabled="!playerName.trim()">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useRoomStore } from '../../store/room'
import { setApiBaseUrl, getApiBaseUrl } from '../../api/config'
import { parseQRCodeData } from '../../utils/qrcode'

const roomStore = useRoomStore()

const roomId = ref('')
const serverUrl = ref(getApiBaseUrl())
const playerName = ref('')
const showPlayerNameModal = ref(false)
const roomType = ref('')

const scanQRCode = () => {
  // #ifdef MP-WEIXIN || APP-PLUS
  uni.scanCode({
    success: (res) => {
      const qrData = parseQRCodeData(res.result)
      if (qrData) {
        roomId.value = qrData.roomId
        serverUrl.value = qrData.serverUrl
        roomType.value = qrData.roomType
        showPlayerNameModal.value = true
      } else {
        uni.showToast({
          title: '无效的二维码',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      console.error('扫码失败:', err)
      uni.showToast({
        title: '扫码失败',
        icon: 'none'
      })
    }
  })
  // #endif
  
  // #ifdef H5
  uni.showToast({
    title: 'H5暂不支持扫码',
    icon: 'none'
  })
  // #endif
}

const showJoinModal = () => {
  if (!roomId.value || roomId.value.length !== 6) {
    uni.showToast({
      title: '请输入6位房间号',
      icon: 'none'
    })
    return
  }
  showPlayerNameModal.value = true
}

const closePlayerNameModal = () => {
  showPlayerNameModal.value = false
  playerName.value = ''
}

const confirmJoin = async () => {
  if (!playerName.value.trim()) {
    uni.showToast({
      title: '请输入玩家名称',
      icon: 'none'
    })
    return
  }
  
  if (serverUrl.value && serverUrl.value !== getApiBaseUrl()) {
    try {
      setApiBaseUrl(serverUrl.value)
    } catch (e) {
      uni.showToast({
        title: e.message || '服务器地址无效',
        icon: 'none'
      })
      return
    }
  }
  
  const result = await roomStore.joinRoom(roomId.value, playerName.value.trim())
  
  if (result.success) {
    showPlayerNameModal.value = false
    uni.showToast({
      title: '加入成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      const targetPage = getTargetPage()
      uni.redirectTo({
        url: targetPage
      })
    }, 1000)
  } else {
    uni.showToast({
      title: result.message || '加入失败',
      icon: 'none'
    })
  }
}

const getTargetPage = () => {
  switch (roomType.value) {
    case 'werewolf':
      return '/pages/boardgame/werewolf-room'
    case 'avalon':
      return '/pages/boardgame/avalon-room'
    case 'rank':
      return '/pages/rank/room'
    default:
      return '/pages/boardgame/werewolf-room'
  }
}
</script>

<style lang="scss" scoped>
.scan-join-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
}

.page-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.page-desc {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.scan-section {
  margin-bottom: 60rpx;
}

.scan-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  background: rgba(255, 255, 255, 0.2);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 24rpx;
  
  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}

.scan-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.scan-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: rgba(255, 255, 255, 0.3);
}

.divider-text {
  padding: 0 30rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.manual-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 40rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.input-field {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #333333;
  
  &::placeholder {
    color: #999999;
  }
}

.join-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333333;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-top: 20rpx;
  
  &[disabled] {
    opacity: 0.5;
  }
  
  &:active {
    opacity: 0.9;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.modal-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  text-align: center;
  margin-bottom: 30rpx;
}

.modal-input {
  width: 100%;
  height: 88rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.cancel {
    background: #f5f5f5;
    color: #666666;
  }
  
  &.confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    
    &[disabled] {
      opacity: 0.5;
    }
  }
}
</style>
