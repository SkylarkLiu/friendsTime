<template>
  <view class="anonymous-chat">
    <!-- 房间入口界面 -->
    <view v-if="!isInRoom" class="room-entry">
      <view class="entry-card">
        <text class="entry-title">🎭 匿名吐槽墙</text>
        <text class="entry-desc">匿名发言，畅所欲言</text>
        
        <view class="input-section">
          <text class="input-label">房间号</text>
          <view class="input-group">
            <input 
              v-model="roomIdInput" 
              type="number" 
              placeholder="输入6位房间号" 
              class="input-field"
              maxlength="6"
            />
          </view>
        </view>
        
        <view class="input-section" v-if="!isLocalStorageMode">
          <text class="input-label">房间地址</text>
          <text class="input-tip">（玩家请确保与房主一致并连接至同一WIFI）</text>
          <view class="input-group">
            <input 
              v-model="serverAddress" 
              type="text" 
              placeholder="例如：http://192.168.1.100:3000" 
              class="input-field"
            />
          </view>
        </view>
        
        <view class="button-group">
          <button 
            class="btn-primary" 
            @click="createRoom"
          >
            创建房间
          </button>
          <button 
            class="btn-secondary" 
            @click="joinRoom"
            :disabled="!roomIdInput"
          >
            加入房间
          </button>
        </view>
      </view>
    </view>
    
    <!-- 聊天界面 -->
    <view v-else class="chat-content">
      <!-- 顶部信息栏 -->
      <view class="header">
        <view class="header-left">
          <text class="header-title">🎭 匿名吐槽墙</text>
          <text class="header-room">房间: {{ currentRoomId }}</text>
        </view>
        <view class="header-right">
          <button class="leave-btn" @click="leaveRoom">退出</button>
        </view>
      </view>
      
      <!-- 消息列表 -->
      <scroll-view 
        class="message-list" 
        scroll-y 
        :scroll-top="scrollTop"
        @scrolltoupper="loadMoreMessages"
      >
        <view class="message-item" v-for="msg in messageList" :key="msg.id">
          <view class="message-header">
            <view class="avatar">
              <text class="avatar-icon">{{ getAvatarIcon(msg.avatarIndex) }}</text>
            </view>
            <text class="nickname">{{ msg.nickname }}</text>
            <text class="time">{{ formatTime(msg.createTime) }}</text>
          </view>
          
          <view class="message-content">
            <text class="content-text">{{ msg.content }}</text>
          </view>
          
          <view class="message-actions">
            <view class="action-item" @click="likeMessage(msg.id)">
              <text class="action-icon">👍</text>
              <text class="action-count">{{ msg.likes }}</text>
            </view>
            <view class="action-item" @click="dislikeMessage(msg.id)">
              <text class="action-icon">👎</text>
              <text class="action-count">{{ msg.dislikes }}</text>
            </view>
            <view class="action-item" @click="showReplyInput(msg.id)">
              <text class="action-icon">💬</text>
              <text class="action-count">{{ msg.replies?.length || 0 }}</text>
            </view>
          </view>
          
          <!-- 回复列表 -->
          <view class="replies-section" v-if="msg.replies && msg.replies.length > 0">
            <view class="reply-item" v-for="reply in msg.replies" :key="reply.id">
              <view class="reply-header">
                <text class="reply-avatar">{{ getAvatarIcon(reply.avatarIndex) }}</text>
                <text class="reply-nickname">{{ reply.nickname }}</text>
                <text class="reply-time">{{ formatTime(reply.createTime) }}</text>
              </view>
              <text class="reply-content">{{ reply.content }}</text>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-if="messageList.length === 0">
          <text class="empty-icon">💭</text>
          <text class="empty-text">还没有人吐槽，快来抢沙发吧！</text>
        </view>
      </scroll-view>
      
      <!-- 回复输入框 -->
      <view class="reply-input-bar" v-if="replyingTo">
        <input 
          class="reply-input" 
          v-model="replyContent" 
          placeholder="输入回复内容..." 
          :focus="replyInputFocus"
          @blur="hideReplyInput"
          @confirm="submitReply"
        />
        <button class="send-btn" @click="submitReply">发送</button>
      </view>
      
      <!-- 底部输入栏 -->
      <view class="input-bar" v-else>
        <input 
          class="message-input" 
          v-model="inputContent" 
          placeholder="匿名吐槽一下..." 
          :maxlength="500"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!inputContent.trim()">
          发送
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'
import { getApiBaseUrl, setApiBaseUrl, USE_LOCAL_STORAGE } from '@/api/config'
import networkManager from '@/api/network'

const MESSAGES_STORAGE_KEY = 'anonymous_messages'
const CURRENT_ROOM_KEY = 'anonymous_current_room'

const isLocalStorageMode = USE_LOCAL_STORAGE

const roomIdInput = ref('')
const serverAddress = ref(getApiBaseUrl())
const currentRoomId = ref('')
const isInRoom = ref(false)

const inputContent = ref('')
const replyContent = ref('')
const replyingTo = ref(null)
const replyInputFocus = ref(false)
const scrollTop = ref(0)
const allMessages = ref([])

const avatarIcons = ['🎭', '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🐴', '🦄']

const messageList = computed(() => {
  if (!currentRoomId.value) return []
  return allMessages.value
    .filter(msg => msg.roomId === currentRoomId.value)
    .sort((a, b) => b.createTime - a.createTime)
})

const getAvatarIcon = (index) => {
  return avatarIcons[index % avatarIcons.length]
}

const generateRoomId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const generateNickname = () => {
  const adjectives = ['神秘的', '路过的', '匿名的', '隐藏的', '悄悄的', '偷偷的', '隐身的', '神秘的']
  const nouns = ['小可爱', '大侠', '侠客', '路人', '过客', '游客', '访客', '神秘人']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  }
}

const loadMessages = () => {
  const messages = getStorage(MESSAGES_STORAGE_KEY) || []
  allMessages.value = messages
}

const saveMessages = () => {
  setStorage(MESSAGES_STORAGE_KEY, allMessages.value)
}

const loadCurrentRoom = () => {
  const roomData = getStorage(CURRENT_ROOM_KEY)
  if (roomData && roomData.roomId) {
    currentRoomId.value = roomData.roomId
    isInRoom.value = true
  }
}

const saveCurrentRoom = () => {
  setStorage(CURRENT_ROOM_KEY, { roomId: currentRoomId.value })
}

const createRoom = () => {
  if (!isLocalStorageMode && serverAddress.value) {
    try {
      setApiBaseUrl(serverAddress.value)
    } catch (e) {
      uni.showToast({ title: e.message || '服务器地址无效', icon: 'none' })
      return
    }
  }
  
  const roomId = roomIdInput.value || generateRoomId()
  currentRoomId.value = roomId
  isInRoom.value = true
  saveCurrentRoom()
  
  uni.showToast({ title: '房间创建成功', icon: 'success' })
}

const joinRoom = () => {
  if (!roomIdInput.value) {
    uni.showToast({ title: '请输入房间号', icon: 'none' })
    return
  }
  
  if (!isLocalStorageMode && serverAddress.value) {
    try {
      setApiBaseUrl(serverAddress.value)
    } catch (e) {
      uni.showToast({ title: e.message || '服务器地址无效', icon: 'none' })
      return
    }
  }
  
  currentRoomId.value = roomIdInput.value
  isInRoom.value = true
  saveCurrentRoom()
  
  uni.showToast({ title: '加入房间成功', icon: 'success' })
}

const leaveRoom = () => {
  currentRoomId.value = ''
  isInRoom.value = false
  setStorage(CURRENT_ROOM_KEY, null)
}

const sendMessage = () => {
  if (!inputContent.value.trim()) return
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    roomId: currentRoomId.value,
    content: inputContent.value.trim(),
    nickname: generateNickname(),
    avatarIndex: Math.floor(Math.random() * avatarIcons.length),
    likes: 0,
    dislikes: 0,
    replies: [],
    createTime: Date.now()
  }
  
  allMessages.value.push(message)
  saveMessages()
  
  inputContent.value = ''
  
  uni.showToast({ title: '吐槽成功', icon: 'success' })
}

const likeMessage = (msgId) => {
  const msg = allMessages.value.find(m => m.id === msgId)
  if (msg) {
    msg.likes++
    saveMessages()
  }
}

const dislikeMessage = (msgId) => {
  const msg = allMessages.value.find(m => m.id === msgId)
  if (msg) {
    msg.dislikes++
    saveMessages()
  }
}

const showReplyInput = (msgId) => {
  replyingTo.value = msgId
  replyContent.value = ''
  replyInputFocus.value = true
}

const hideReplyInput = () => {
  setTimeout(() => {
    replyingTo.value = null
    replyContent.value = ''
    replyInputFocus.value = false
  }, 200)
}

const submitReply = () => {
  if (!replyContent.value.trim() || !replyingTo.value) return
  
  const msg = allMessages.value.find(m => m.id === replyingTo.value)
  if (msg) {
    if (!msg.replies) {
      msg.replies = []
    }
    
    msg.replies.push({
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: replyContent.value.trim(),
      nickname: generateNickname(),
      avatarIndex: Math.floor(Math.random() * avatarIcons.length),
      createTime: Date.now()
    })
    
    saveMessages()
    
    uni.showToast({ title: '回复成功', icon: 'success' })
  }
  
  replyingTo.value = null
  replyContent.value = ''
  replyInputFocus.value = false
}

const loadMoreMessages = () => {
  uni.showToast({ title: '没有更多了', icon: 'none' })
}

// 检测 WiFi 并自动填入服务器地址
onMounted(async () => {
  if (!isLocalStorageMode) {
    try {
      const info = await networkManager.detectWiFiAndSetServer()
      if (info.serverUrl) {
        serverAddress.value = info.serverUrl
      }
    } catch (e) {
      console.error('检测WiFi失败:', e)
    }
  }
})

loadMessages()
loadCurrentRoom()
</script>

<style lang="scss" scoped>
.anonymous-chat {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

/* 房间入口样式 */
.room-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 30rpx;
}

.entry-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.entry-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 10rpx;
}

.entry-desc {
  display: block;
  font-size: 24rpx;
  color: #999999;
  text-align: center;
  margin-bottom: 40rpx;
}

.input-section {
  margin-bottom: 30rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.input-tip {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 12rpx;
}

.input-group {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 24rpx;
  background: #f8f9ff;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  color: #333333;
  font-size: 28rpx;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #fa709a;
    box-shadow: 0 0 20rpx rgba(250, 112, 154, 0.2);
  }
  
  &::placeholder {
    color: #999999;
  }
}

.button-group {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn-primary, .btn-secondary {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #ffffff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666666;
  
  &[disabled] {
    opacity: 0.5;
  }
}

/* 聊天界面样式 */
.chat-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 4rpx;
}

.header-room {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.header-right {
  margin-left: 20rpx;
}

.leave-btn {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
  
  &:active {
    background: rgba(255, 255, 255, 0.4);
  }
}

.message-list {
  flex: 1;
  padding: 20rpx;
  height: calc(100vh - 320rpx);
}

.message-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.avatar-icon {
  font-size: 32rpx;
}

.nickname {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.time {
  font-size: 22rpx;
  color: #999999;
}

.message-content {
  margin-bottom: 16rpx;
}

.content-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  word-break: break-all;
}

.message-actions {
  display: flex;
  gap: 32rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  
  &:active {
    opacity: 0.7;
  }
}

.action-icon {
  font-size: 28rpx;
}

.action-count {
  font-size: 24rpx;
  color: #666666;
}

.replies-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.reply-item {
  background-color: #f8f9ff;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.reply-avatar {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.reply-nickname {
  font-size: 24rpx;
  font-weight: 500;
  color: #667eea;
  margin-right: 12rpx;
}

.reply-time {
  font-size: 20rpx;
  color: #999999;
}

.reply-content {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
  word-break: break-all;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.input-bar, .reply-input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.message-input, .reply-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background-color: #f8f9ff;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #333333;
  
  &::placeholder {
    color: #999999;
  }
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  margin-left: 16rpx;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border-radius: 36rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &[disabled] {
    opacity: 0.5;
  }
  
  &:active {
    opacity: 0.8;
  }
}
</style>
