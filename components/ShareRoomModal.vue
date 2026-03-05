<template>
  <view class="share-modal" v-if="visible" @click="handleClose">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">分享房间</text>
        <view class="close-btn" @click="handleClose">✕</view>
      </view>
      
      <view class="wifi-tip">
        <text class="wifi-icon">📶</text>
        <text class="wifi-text">请连接至同一WiFi哦！</text>
      </view>
      
      <view class="qrcode-section">
        <view class="qrcode-container">
          <canvas 
            canvas-id="qrcodeCanvas"
            class="qrcode-canvas"
            :style="{ width: '200px', height: '200px' }"
          />
        </view>
      </view>
      
      <view class="room-info">
        <view class="info-row">
          <text class="info-label">房间号</text>
          <text class="info-value">{{ roomId }}</text>
          <button class="copy-btn" @click="copyRoomId">复制</button>
        </view>
        <view class="info-row" v-if="serverUrl">
          <text class="info-label">服务器</text>
          <text class="info-value server-url">{{ serverUrl }}</text>
          <button class="copy-btn" @click="copyServerUrl">复制</button>
        </view>
      </view>
      
      <view class="share-tips">
        <text class="tips-text">其他玩家扫码或手动输入房间号即可加入</text>
      </view>
      
      <button class="save-btn" @click="saveQRCode">保存二维码</button>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, getCurrentInstance, nextTick } from 'vue'
import { generateQRCodeData, generateQRCodeWithCanvas, getCanvasImagePath } from '../utils/qrcode'
import { getApiBaseUrl } from '../api/config'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  roomId: {
    type: String,
    default: ''
  },
  roomType: {
    type: String,
    default: 'werewolf'
  },
  serverUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const instance = getCurrentInstance()
const canvasImagePath = ref('')

const generateQRCode = async () => {
  if (!props.roomId) return
  
  try {
    const serverUrl = props.serverUrl || getApiBaseUrl()
    const qrData = generateQRCodeData(props.roomId, serverUrl, props.roomType)
    
    await nextTick()
    
    await generateQRCodeWithCanvas('qrcodeCanvas', qrData, instance)
    
    const imagePath = await getCanvasImagePath('qrcodeCanvas', instance)
    canvasImagePath.value = imagePath
  } catch (e) {
    console.error('生成二维码失败:', e)
    uni.showToast({
      title: '生成二维码失败',
      icon: 'none'
    })
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      generateQRCode()
    })
  }
})

onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      generateQRCode()
    })
  }
})

const handleClose = () => {
  emit('close')
}

const copyRoomId = () => {
  uni.setClipboardData({
    data: props.roomId,
    success: () => {
      uni.showToast({
        title: '房间号已复制',
        icon: 'success'
      })
    }
  })
}

const copyServerUrl = () => {
  const url = props.serverUrl || getApiBaseUrl()
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({
        title: '服务器地址已复制',
        icon: 'success'
      })
    }
  })
}

const saveQRCode = async () => {
  if (!canvasImagePath.value) {
    try {
      const imagePath = await getCanvasImagePath('qrcodeCanvas', instance)
      canvasImagePath.value = imagePath
    } catch (e) {
      console.error('获取图片路径失败:', e)
    }
  }
  
  if (!canvasImagePath.value) {
    uni.showToast({
      title: '请先生成二维码',
      icon: 'none'
    })
    return
  }
  
  uni.saveImageToPhotosAlbum({
    filePath: canvasImagePath.value,
    success: () => {
      uni.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('保存失败:', err)
      uni.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  
  &:hover {
    color: #666;
  }
}

.wifi-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.wifi-icon {
  font-size: 20px;
}

.wifi-text {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 500;
}

.qrcode-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qrcode-container {
  width: 200px;
  height: 200px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.qrcode-canvas {
  width: 200px;
  height: 200px;
}

.room-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: #666;
  width: 60px;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.server-url {
    font-size: 12px;
    color: #666;
  }
}

.copy-btn {
  width: 50px;
  height: 28px;
  line-height: 28px;
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  border: none;
  border-radius: 4px;
  padding: 0;
  margin-left: 8px;
  
  &:active {
    background: #d6e4ff;
  }
}

.share-tips {
  text-align: center;
  margin-bottom: 16px;
}

.tips-text {
  font-size: 12px;
  color: #999;
}

.save-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  
  &:active {
    opacity: 0.9;
  }
}
</style>
