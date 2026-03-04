<template>
  <view class="room-page">
    <view class="entry-section" v-if="isInRoom === false">
      <view class="entry-header">
        <text class="entry-title">🏆 好友排名房间</text>
        <text class="entry-desc">输入房间码加入，或创建新房间</text>
      </view>
      
      <view class="entry-actions">
        <button class="entry-btn primary" @click="showJoinModal">
          <text class="btn-icon">🚪</text>
          <text class="btn-text">加入房间</text>
        </button>
        <button class="entry-btn secondary" @click="showCreateModal">
          <text class="btn-icon">➕</text>
          <text class="btn-text">创建房间</text>
        </button>
        <button class="entry-btn secondary" @click="showServerConfig">
          <text class="btn-icon">⚙️</text>
          <text class="btn-text">服务器设置</text>
        </button>
      </view>
      
      <view class="recent-rooms" v-if="recentRooms.length > 0">
        <text class="recent-title">最近房间</text>
        <view class="recent-list">
          <view 
            class="recent-item" 
            v-for="room in recentRooms" 
            :key="room.roomId"
            @click="quickJoinRoom(room.roomId)"
          >
            <view class="recent-info">
              <text class="recent-name">{{ room.name }}</text>
              <text class="recent-id">房间码: {{ room.roomId }}</text>
            </view>
            <text class="recent-players">{{ room.players.length }}人</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="room-section" v-if="isInRoom === true">
      <view class="room-header card">
        <view class="room-info">
          <text class="room-name">{{ currentRoom.name }}</text>
          <view class="room-meta">
            <text class="room-id">房间码: {{ currentRoom.roomId }}</text>
            <text class="room-count">{{ playerCount }}人</text>
          </view>
          <view v-if="wifiInfo.isWiFi" class="wifi-info">
            <text class="wifi-icon">📶</text>
            <text class="wifi-text">WiFi局域网</text>
          </view>
        </view>
        <view class="room-actions">
          <button class="action-btn small" @click="copyRoomId">复制</button>
          <button class="action-btn small danger" @click="handleLeaveRoom">退出</button>
        </view>
      </view>
      
      <!-- 服务器信息（仅房主可见） -->
      <view v-if="isHost && wifiInfo.serverUrl" class="server-info card">
        <view class="server-header">
          <text class="server-icon">🖥️</text>
          <text class="server-title">服务器地址</text>
        </view>
        <view class="server-content">
          <text class="server-url">{{ wifiInfo.serverUrl }}</text>
          <button class="copy-btn" @click="copyServerUrl">复制</button>
        </view>
        <text class="server-tip">其他玩家连接同一WiFi后，使用此地址加入房间</text>
      </view>
      
      <view class="rank-section card">
        <view class="rank-header">
          <text class="rank-title">排行榜</text>
          <button class="add-player-btn" @click="showAddPlayerModal = true">
            <text>+ 添加玩家</text>
          </button>
        </view>
        
        <view class="rank-list" v-if="rankList.length > 0">
          <view 
            class="rank-item" 
            v-for="(player, index) in rankList" 
            :key="player.id"
          >
            <view class="rank-position" :class="{
              'gold': index === 0,
              'silver': index === 1,
              'bronze': index === 2
            }">
              <text v-if="index < 3">{{ ['🥇', '🥈', '🥉'][index] }}</text>
              <text v-else>{{ index + 1 }}</text>
            </view>
            <view class="rank-avatar">
              <text class="avatar-text">{{ player.name.charAt(0) }}</text>
            </view>
            <view class="rank-info">
              <text class="rank-name">{{ player.name }}</text>
              <text class="rank-games">{{ player.scores.length }}局</text>
            </view>
            <view class="rank-score">
              <text class="score-value">{{ player.totalScore }}</text>
              <text class="score-label">总分</text>
            </view>
            <view class="rank-actions">
              <view class="action-btn score" @click="showAddScoreModal(player)">
                <text>+</text>
              </view>
              <view class="action-btn delete" @click="handleRemovePlayer(player.id)">
                <text>-</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-else>
          <text class="empty-icon">👥</text>
          <text class="empty-text">暂无玩家，点击上方添加</text>
        </view>
      </view>
      
      <view class="game-history card" v-if="currentRoom.players.some(p => p.scores.length > 0)">
        <view class="history-header" @click="showHistory = !showHistory">
          <text class="history-title">游戏记录</text>
          <text class="history-toggle">{{ showHistory ? '收起' : '展开' }}</text>
        </view>
        <view class="history-list" v-if="showHistory">
          <view 
            class="history-item" 
            v-for="record in gameHistory" 
            :key="record.time"
          >
            <view class="history-info">
              <text class="history-player">{{ record.playerName }}</text>
              <text class="history-game">{{ record.game }}</text>
            </view>
            <view class="history-score">
              <text class="score-plus" v-if="record.score > 0">+{{ record.score }}</text>
              <text class="score-minus" v-else>{{ record.score }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showJoinRoomModal === true" @click="handleCloseJoinModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">加入房间</text>
        <input 
          class="modal-input" 
          v-model="inputRoomId" 
          placeholder="请输入6位房间码"
          type="number"
          maxlength="6"
        />
        <input 
          class="modal-input" 
          v-model="inputPlayerName" 
          placeholder="请输入你的昵称"
          maxlength="10"
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showJoinRoomModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleJoinRoom">加入</button>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showCreateRoomModal === true" @click="handleCloseCreateModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">创建房间</text>
        <input 
          class="modal-input" 
          v-model="inputRoomName" 
          placeholder="请输入房间名称"
          maxlength="20"
        />
        <input 
          class="modal-input" 
          v-model="inputPlayerName" 
          placeholder="请输入你的昵称"
          maxlength="10"
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showCreateRoomModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleCreateRoom">创建</button>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showAddPlayerModal === true" @click="handleCloseAddPlayerModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">添加玩家</text>
        <input 
          class="modal-input" 
          v-model="inputNewPlayerName" 
          placeholder="请输入玩家昵称"
          maxlength="10"
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showAddPlayerModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleAddPlayer">添加</button>
        </view>
      </view>
    </view>
    
    <view class="modal" v-if="showScoreModal === true" @click="handleCloseScoreModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">录入分数</text>
        <text class="modal-subtitle">玩家: {{ selectedPlayer && selectedPlayer.name }}</text>
        <input 
          class="modal-input" 
          v-model="inputGameName" 
          placeholder="游戏名称（如：狼人杀）"
          maxlength="20"
        />
        <input 
          class="modal-input" 
          v-model="inputScore" 
          placeholder="分数（正数加分，负数扣分）"
          type="number"
        />
        <input 
          class="modal-input" 
          v-model="inputRole" 
          placeholder="角色（可选）"
          maxlength="20"
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showScoreModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleAddScore">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomStore } from '@/store/room'
import networkManager from '@/api/network'
import { getApiBaseUrl, setApiBaseUrl, clearApiBaseUrl } from '@/api/config'

const roomStore = useRoomStore()

// WiFi 信息
const wifiInfo = ref({
  isWiFi: false,
  localIP: null,
  serverUrl: ''
})

const isInRoom = computed(() => roomStore.isInRoom)
const currentRoom = computed(() => roomStore.currentRoom)
const playerCount = computed(() => roomStore.playerCount)
const rankList = computed(() => roomStore.rankList)

const recentRooms = computed(() => roomStore.getAllRooms().slice(0, 5))

const gameHistory = computed(() => {
  if (!currentRoom.value) return []
  
  const history = []
  currentRoom.value.players.forEach(player => {
    player.scores.forEach(score => {
      history.push({
        playerName: player.name,
        game: score.game,
        score: score.score,
        role: score.role,
        time: score.time
      })
    })
  })
  
  return history.sort((a, b) => b.time - a.time).slice(0, 20)
})

const showJoinRoomModal = ref(false)
const showCreateRoomModal = ref(false)
const showAddPlayerModal = ref(false)
const showScoreModal = ref(false)
const showHistory = ref(false)

const inputRoomId = ref('')
const inputRoomName = ref('')
const inputPlayerName = ref('')
const inputNewPlayerName = ref('')
const inputGameName = ref('')
const inputScore = ref('')
const inputRole = ref('')
const selectedPlayer = ref(null)

onMounted(async () => {
  roomStore.loadCurrentRoom()
  
  // 检测 WiFi 并获取服务器信息
  try {
    const info = await networkManager.detectWiFiAndSetServer()
    wifiInfo.value = info
  } catch (e) {
    console.error('检测WiFi失败:', e)
  }
})

const showJoinModal = () => {
  inputRoomId.value = ''
  inputPlayerName.value = ''
  showJoinRoomModal.value = true
}

const showCreateModal = () => {
  inputRoomName.value = ''
  inputPlayerName.value = ''
  showCreateRoomModal.value = true
}

const showServerConfig = () => {
  const current = getApiBaseUrl()
  uni.showModal({
    title: '服务器设置',
    editable: true,
    placeholderText: '例如：http://192.168.1.100:3000',
    content: current,
    confirmText: '保存',
    cancelText: '取消',
    success: (res) => {
      if (!res.confirm) return
      const value = (res.content || '').trim()
      try {
        if (!value) {
          clearApiBaseUrl()
          uni.showToast({ title: '已恢复默认地址', icon: 'success' })
          return
        }
        setApiBaseUrl(value)
        uni.showToast({ title: '已保存', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e.message || '地址无效', icon: 'none' })
      }
    }
  })
}

const handleCloseJoinModal = () => {
  showJoinRoomModal.value = false
}

const handleCloseCreateModal = () => {
  showCreateRoomModal.value = false
}

const handleCloseAddPlayerModal = () => {
  showAddPlayerModal.value = false
}

const handleCloseScoreModal = () => {
  showScoreModal.value = false
}

const handleJoinRoom = async () => {
  if (!inputRoomId.value || inputRoomId.value.length !== 6) {
    uni.showToast({
      title: '请输入6位房间码',
      icon: 'none'
    })
    return
  }
  
  if (!inputPlayerName.value.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none'
    })
    return
  }
  
  const result = await roomStore.joinRoom(inputRoomId.value, inputPlayerName.value.trim())
  
  if (result.success) {
    showJoinRoomModal.value = false
    uni.showToast({
      title: '加入成功',
      icon: 'success'
    })
  } else {
    uni.showModal({
      title: '提示',
      content: result.message + '，是否创建新房间？',
      success: (res) => {
        if (res.confirm) {
          showJoinRoomModal.value = false
          inputRoomName.value = `房间${inputRoomId.value}`
          showCreateRoomModal.value = true
        }
      }
    })
  }
}

const handleCreateRoom = async () => {
  if (!inputRoomName.value.trim()) {
    uni.showToast({
      title: '请输入房间名称',
      icon: 'none'
    })
    return
  }
  
  if (!inputPlayerName.value.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none'
    })
    return
  }
  
  try {
    await roomStore.createRoom(inputRoomName.value.trim(), 'slaughter_side', {
      hostName: inputPlayerName.value.trim()
    })
    showCreateRoomModal.value = false
    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })
  } catch (e) {
    uni.showToast({
      title: e.message || '创建失败',
      icon: 'none'
    })
  }
}

const quickJoinRoom = async (roomId) => {
  uni.showModal({
    title: '加入房间',
    editable: true,
    placeholderText: '请输入你的昵称',
    success: async (res) => {
      if (res.confirm && res.content) {
        const result = await roomStore.joinRoom(roomId, res.content.trim())
        if (result.success) {
          uni.showToast({
            title: '加入成功',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      }
    }
  })
}

const handleLeaveRoom = async () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出当前房间吗？',
    success: async (res) => {
      if (res.confirm) {
        await roomStore.leaveRoom()
        uni.showToast({
          title: '已退出房间',
          icon: 'success'
        })
      }
    }
  })
}

const handleAddPlayer = async () => {
  if (!inputNewPlayerName.value.trim()) {
    uni.showToast({
      title: '请输入玩家昵称',
      icon: 'none'
    })
    return
  }
  
  const result = await roomStore.addPlayer(inputNewPlayerName.value.trim())
  
  if (result.success) {
    showAddPlayerModal.value = false
    inputNewPlayerName.value = ''
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })
  } else {
    uni.showToast({
      title: result.message,
      icon: 'none'
    })
  }
}

const handleRemovePlayer = async (playerId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要移除该玩家吗？',
    success: async (res) => {
      if (res.confirm) {
        await roomStore.removePlayer(playerId)
        uni.showToast({
          title: '已移除',
          icon: 'success'
        })
      }
    }
  })
}

const showAddScoreModal = (player) => {
  selectedPlayer.value = player
  inputGameName.value = '狼人杀'
  inputScore.value = ''
  inputRole.value = ''
  showScoreModal.value = true
}

const handleAddScore = async () => {
  if (!inputGameName.value.trim()) {
    uni.showToast({
      title: '请输入游戏名称',
      icon: 'none'
    })
    return
  }
  
  if (!inputScore.value) {
    uni.showToast({
      title: '请输入分数',
      icon: 'none'
    })
    return
  }
  
  const result = await roomStore.addScore(selectedPlayer.value.id, {
    game: inputGameName.value.trim(),
    score: parseInt(inputScore.value),
    role: inputRole.value.trim()
  })
  
  if (result.success) {
    showScoreModal.value = false
    uni.showToast({
      title: '录入成功',
      icon: 'success'
    })
  }
}

const copyRoomId = () => {
  uni.setClipboardData({
    data: currentRoom.value.roomId,
    success: () => {
      uni.showToast({
        title: '房间码已复制',
        icon: 'success'
      })
    }
  })
}

// 复制服务器地址
const copyServerUrl = () => {
  uni.setClipboardData({
    data: wifiInfo.value.serverUrl,
    success: () => {
      uni.showToast({ title: '服务器地址已复制', icon: 'success' })
    }
  })
}


</script>

<style lang="scss" scoped>
.room-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.entry-section {
  padding: 60rpx 30rpx;
}

.entry-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.entry-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}

.entry-desc {
  display: block;
  font-size: 28rpx;
  color: #999999;
}

.entry-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 60rpx;
}

.entry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  border-radius: 20rpx;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
  }
  
  &.secondary {
    background-color: #ffffff;
    color: #667eea;
    border: 2rpx solid #667eea;
  }
  
  &:active {
    opacity: 0.8;
  }
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
}

.recent-rooms {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.recent-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9ff;
  border-radius: 12rpx;
  
  &:active {
    background-color: #f0f2ff;
  }
}

.recent-info {
  display: flex;
  flex-direction: column;
}

.recent-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6rpx;
}

.recent-id {
  font-size: 22rpx;
  color: #999999;
}

.recent-players {
  font-size: 24rpx;
  color: #667eea;
}

.room-section {
  padding: 30rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  flex: 1;
}

.room-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 10rpx;
}

.room-meta {
  display: flex;
  gap: 20rpx;
}

.room-id, .room-count {
  font-size: 24rpx;
  color: #999999;
}

.wifi-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.wifi-icon {
  font-size: 20rpx;
}

.wifi-text {
  font-size: 20rpx;
  color: #4caf50;
  font-weight: 500;
}

.server-info {
  background: rgba(76, 175, 80, 0.1);
  border: 1rpx solid rgba(76, 175, 80, 0.3);
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

.server-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.server-icon {
  font-size: 24rpx;
}

.server-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #4caf50;
}

.server-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.server-url {
  flex: 1;
  font-size: 24rpx;
  color: #333333;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  word-break: break-all;
}

.copy-btn {
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #ffffff;
  border: none;
  
  &:active {
    opacity: 0.8;
  }
}

.server-tip {
  display: block;
  font-size: 20rpx;
  color: #666666;
  line-height: 1.4;
}

.room-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  
  &.small {
    background-color: #f5f5f5;
    color: #666666;
  }
  
  &.danger {
    background-color: #ffebee;
    color: #f44336;
  }
  
  &.score {
    width: 48rpx;
    height: 48rpx;
    background-color: #e8f5e9;
    color: #4caf50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 32rpx;
  }
  
  &.delete {
    width: 48rpx;
    height: 48rpx;
    background-color: #ffebee;
    color: #f44336;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 32rpx;
  }
  
  &:active {
    opacity: 0.8;
  }
}

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.rank-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.add-player-btn {
  background-color: #f8f9ff;
  color: #667eea;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
}

.rank-list {
  display: flex;
  flex-direction: column;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.rank-position {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #999999;
  
  &.gold, &.silver, &.bronze {
    font-size: 40rpx;
  }
}

.rank-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 20rpx;
}

.avatar-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
}

.rank-info {
  flex: 1;
  
  .rank-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333333;
  }
  
  .rank-games {
    display: block;
    font-size: 22rpx;
    color: #999999;
    margin-top: 6rpx;
  }
}

.rank-score {
  text-align: center;
  margin-right: 20rpx;
  
  .score-value {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #667eea;
  }
  
  .score-label {
    display: block;
    font-size: 20rpx;
    color: #999999;
  }
}

.rank-actions {
  display: flex;
  gap: 12rpx;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #999999;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  
  &:active {
    background-color: #f8f9ff;
  }
}

.history-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.history-toggle {
  font-size: 24rpx;
  color: #999999;
}

.history-list {
  padding-top: 20rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background-color: #f8f9ff;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.history-info {
  display: flex;
  flex-direction: column;
}

.history-player {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.history-game {
  font-size: 22rpx;
  color: #999999;
}

.history-score {
  font-size: 28rpx;
  font-weight: bold;
  
  .score-plus {
    color: #4caf50;
  }
  
  .score-minus {
    color: #f44336;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 600rpx;
  background-color: #ffffff;
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

.modal-subtitle {
  display: block;
  font-size: 26rpx;
  color: #666666;
  text-align: center;
  margin-bottom: 20rpx;
}

.modal-input {
  width: 100%;
  height: 88rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
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
    background-color: #f5f5f5;
    color: #666666;
  }
  
  &.confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
  }
}
</style>
