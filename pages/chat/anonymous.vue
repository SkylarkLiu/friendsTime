<template>
  <view class="anonymous-chat">
    <!-- 顶部信息栏 -->
    <view class="header">
      <text class="header-title">匿名吐槽墙</text>
      <text class="header-desc">匿名发言，畅所欲言</text>
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
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

const MESSAGES_STORAGE_KEY = 'anonymous_messages'

const inputContent = ref('')
const replyContent = ref('')
const replyingTo = ref(null)
const replyInputFocus = ref(false)
const scrollTop = ref(0)
const messageList = ref([])

const avatarIcons = ['🎭', '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🐴', '🦄']

const getAvatarIcon = (index) => {
  return avatarIcons[index % avatarIcons.length]
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
  messageList.value = messages.sort((a, b) => b.createTime - a.createTime)
}

const saveMessages = () => {
  setStorage(MESSAGES_STORAGE_KEY, messageList.value)
}

const sendMessage = () => {
  if (!inputContent.value.trim()) return
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: inputContent.value.trim(),
    nickname: generateNickname(),
    avatarIndex: Math.floor(Math.random() * avatarIcons.length),
    likes: 0,
    dislikes: 0,
    replies: [],
    createTime: Date.now()
  }
  
  messageList.value.unshift(message)
  saveMessages()
  
  inputContent.value = ''
  
  uni.showToast({ title: '吐槽成功', icon: 'success' })
}

const likeMessage = (msgId) => {
  const msg = messageList.value.find(m => m.id === msgId)
  if (msg) {
    msg.likes++
    saveMessages()
  }
}

const dislikeMessage = (msgId) => {
  const msg = messageList.value.find(m => m.id === msgId)
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
  
  const msg = messageList.value.find(m => m.id === replyingTo.value)
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

loadMessages()
</script>

<style lang="scss" scoped>
.anonymous-chat {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  padding: 40rpx 30rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 8rpx;
}

.header-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.message-list {
  flex: 1;
  padding: 20rpx;
  height: calc(100vh - 280rpx);
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
