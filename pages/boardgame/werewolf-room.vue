<template>
  <view class="werewolf-room">
    <!-- 房间创建/加入界面 -->
    <view v-if="!isInRoom" class="room-entry">
      <view class="entry-card">
        <text class="entry-title">狼人杀房间</text>
        
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
        
        <view class="input-section">
          <text class="input-label">昵称</text>
          <view class="input-group">
            <input 
              v-model="playerName" 
              type="text" 
              placeholder="输入你的昵称" 
              class="input-field"
              maxlength="10"
            />
          </view>
        </view>
        
        <view class="button-group">
          <button 
            class="btn-primary" 
            @click="createRoom"
            :disabled="!playerName"
          >
            创建房间
          </button>
          <button 
            class="btn-secondary" 
            @click="joinRoom"
            :disabled="!roomIdInput || !playerName"
          >
            加入房间
          </button>
        </view>
      </view>
    </view>
    
    <!-- 房间内界面 -->
    <view v-else class="room-content">
      <!-- 顶部房间信息 -->
      <view class="room-header card">
        <view class="room-info">
          <text class="room-id">房间号: {{ currentRoom.roomId }}</text>
          <text class="player-count">{{ currentRoom.players.length }}/18 人</text>
          <text class="network-status" :class="networkStatus">网络: {{ connectionStatusText }}</text>
        </view>
        <view class="room-status" :class="{ 'playing': gameState === 'dealing' || gameState === 'all_confirmed' || gameState === 'judge_view' }">
          <text class="status-text">{{ gameStatusText }}</text>
        </view>
      </view>
      
      <!-- 玩家列表 -->
      <view class="player-list card">
        <text class="list-title">玩家列表</text>
        <view class="players-grid">
          <view 
            v-for="(player, index) in currentRoom.players" 
            :key="player.id"
            :class="['player-item', { 'host': isPlayerHost(player), 'viewed': player.hasViewedRole, 'dead': !player.isAlive }]"
          >
            <view class="player-avatar">
              <text class="avatar-icon">{{ getPlayerAvatar(player) }}</text>
              <view v-if="isPlayerHost(player)" class="crown-icon">👑</view>
              <view v-if="!player.isAlive" class="death-icon" :class="player.deathType === 'killed' ? 'killed' : 'voted'">
                {{ player.deathType === 'killed' ? '💀' : '🗳️' }}
              </view>
            </view>
            <text class="player-name">{{ player.name }}</text>
            <text v-if="player.hasViewedRole" class="viewed-status">✓</text>
            
            <!-- 房主操作按钮 -->
            <view v-if="isHost && gameState !== 'idle'" class="player-actions">
              <button 
                v-if="player.isAlive" 
                class="action-btn kill-btn" 
                @click="handleKillPlayer(player)"
              >
                击杀
              </button>
              <button 
                v-if="player.isAlive" 
                class="action-btn vote-btn" 
                @click="handleVotePlayer(player)"
              >
                投票
              </button>
              <button 
                v-else 
                class="action-btn revive-btn" 
                @click="handleRevivePlayer(player)"
              >
                复活
              </button>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 游戏配置（仅房主可见） -->
      <view v-if="isHost && gameState === 'idle'" class="config-section card">
        <text class="section-title">游戏配置</text>
        
        <!-- 胜利条件选择 -->
        <view class="win-condition-section">
          <text class="config-label">胜利条件</text>
          <view class="radio-group">
            <view 
              :class="['radio-item', winCondition === 'slaughter_side' ? 'active' : '']"
              @click="handleWinConditionChange('slaughter_side')"
            >
              <text class="radio-label">标准屠边 (推荐)</text>
              <text class="radio-desc">消灭所有神职或所有平民</text>
            </view>
            <view 
              :class="['radio-item', winCondition === 'slaughter_all' ? 'active' : '']"
              @click="handleWinConditionChange('slaughter_all')"
            >
              <text class="radio-label">屠城模式</text>
              <text class="radio-desc">消灭所有好人 (神职+平民)</text>
            </view>
          </view>
        </view>
        
        <view class="config-tabs">
          <view 
            :class="['tab-item', configMode === 'preset' ? 'active' : '']"
            @click="configMode = 'preset'"
          >
            <text>预设板子</text>
          </view>
          <view 
            :class="['tab-item', configMode === 'custom' ? 'active' : '']"
            @click="configMode = 'custom'"
          >
            <text>自定义</text>
          </view>
        </view>
        
        <view class="preset-section" v-if="configMode === 'preset'">
          <view class="config-item">
            <text class="config-label">玩家人数</text>
            <view class="stepper">
              <view class="stepper-btn" @click="decreasePlayers">-</view>
              <text class="stepper-value">{{ playerCount }}人</text>
              <view class="stepper-btn" @click="increasePlayers">+</view>
            </view>
          </view>
          
          <view class="preset-list">
            <view 
              :class="['preset-item', selectedPreset && selectedPreset.id === preset.id ? 'active' : '']" 
              v-for="preset in availablePresets" 
              :key="preset.id"
              @click="selectPreset(preset)"
            >
              <view class="preset-info">
                <text class="preset-name">{{ preset.name }}</text>
                <text class="preset-desc">{{ preset.description }}</text>
              </view>
              <view class="preset-roles">
                <text class="role-badge" v-for="role in preset.roles.slice(0, 4)" :key="role.id">
                  {{ role.icon }}{{ role.count }}
                </text>
                <text class="role-more" v-if="preset.roles.length > 4">...</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="custom-section" v-if="configMode === 'custom'">
          <view class="config-item">
            <text class="config-label">玩家人数</text>
            <text class="config-value">{{ totalRoles }} / {{ playerCount }} 人</text>
          </view>
          
          <view class="role-config">
            <view class="role-item" v-for="role in roleConfig" :key="role.id">
              <view class="role-info">
                <text class="role-icon">{{ role.icon }}</text>
                <text class="role-name">{{ role.name }}</text>
              </view>
              <view class="stepper small">
                <view class="stepper-btn" @click="decreaseRole(role.id)">-</view>
                <text class="stepper-value">{{ role.count }}</text>
                <view class="stepper-btn" @click="increaseRole(role.id)">+</view>
              </view>
            </view>
          </view>
          
          <view class="total-info">
            <text class="total-text">已配置: {{ totalRoles }} / {{ playerCount }} 人</text>
            <text class="total-hint" v-if="totalRoles !== playerCount">请确保角色数量与玩家人数一致</text>
          </view>
        </view>
      </view>
      
      <!-- 身份卡片展示 -->
      <view v-if="showRoleCard" class="role-card-overlay" @click="closeRoleCard">
        <view class="role-card-container" @click.stop>
          <view :class="['role-card', { 'flipped': cardFlipped }]" :style="{ '--card-color': currentRole?.color || '#666666' }">
            <view class="card-front">
              <text class="card-number">{{ currentPlayerNumber }}号</text>
              <text class="card-hint">点击查看身份</text>
            </view>
            <view class="card-back">
              <view class="camp-info">
                <text class="camp-icon">{{ getCampIcon(currentRole?.camp) }}</text>
                <text class="camp-name">{{ currentRole?.campName }}</text>
              </view>
              <text class="role-icon">{{ currentRole?.icon }}</text>
              <text class="role-name">【{{ currentRole?.name }}】</text>
              <view class="card-divider"></view>
              <view class="skills-section">
                <text class="section-title">📜 角色技能</text>
                <view class="skills-list">
                  <text class="skill-item" v-for="(skill, index) in currentRole?.skills" :key="index">• {{ skill }}</text>
                </view>
              </view>
              <view class="card-divider"></view>
              <view class="strategy-section">
                <text class="section-title">💡 玩法建议</text>
                <text class="strategy-text">{{ currentRole?.strategy }}</text>
              </view>
            </view>
          </view>
          <button class="btn-primary confirm-btn" @click="confirmRole">确认</button>
        </view>
      </view>
      
      <!-- 结算结果弹窗 -->
      <view v-if="showResultModal" class="result-overlay" @click="backToRoom">
        <view class="result-container" @click.stop>
          <text class="result-title">🎉 游戏结束 🎉</text>
          
          <view class="result-content">
            <view class="winner-section">
              <text class="winner-label">【胜利方】</text>
              <text class="winner-text" v-if="gameResult === 'wolf_win'">
                🐺 狼人阵营 获得胜利！
              </text>
              <text class="winner-text" v-else-if="gameResult === 'good_win'">
                👨‍🌾 好人阵营 获得胜利！
              </text>
              <text class="winner-text" v-else-if="gameResult === 'idiot_win'">
                🤪 白痴 获得胜利！
              </text>
            </view>
            
            <view class="reason-section">
              <text class="reason-label">【获胜原因】</text>
              <text class="reason-text" v-if="gameResult === 'wolf_win'">
                {{ currentRoom.winCondition === 'slaughter_side' ? '成功达成"屠边"条件' : '成功达成"屠城"条件' }}
              </text>
              <text class="reason-text" v-else-if="gameResult === 'good_win'">
                所有狼人被消灭
              </text>
              <text class="reason-text" v-else-if="gameResult === 'idiot_win'">
                白痴被投票出局，触发特殊胜利条件
              </text>
            </view>
            
            <view class="players-section">
              <text class="players-label">【玩家战绩】</text>
              <view class="players-list">
                <view class="player-record" v-for="player in currentRoom.players" :key="player.id">
                  <text class="player-name">{{ player.name }}</text>
                  <text class="player-role">({{ player.role?.name || '未知' }})</text>
                  <text class="player-status" v-if="player.isAlive">- 存活</text>
                  <text class="player-status" v-else>
                    - 第{{ player.deathRound }}轮{{ player.deathType === 'killed' ? '被击杀' : '被投票' }} {{ player.deathType === 'killed' ? '💀' : '🗳️' }}
                  </text>
                </view>
              </view>
            </view>
          </view>
          
          <view class="result-actions">
            <button class="btn-secondary" @click="backToRoom">返回房间</button>
            <button class="btn-primary" @click="playAgain">再来一局</button>
          </view>
        </view>
      </view>
      
      <!-- 底部操作栏 -->
      <view class="action-section">
        <!-- 房主操作按钮 -->
        <button 
          v-if="isHost" 
          class="btn-primary" 
          @click="startGame"
          :disabled="gameState !== 'idle' || currentRoom.players.length < 6 || (configMode === 'custom' && totalRoles !== playerCount)"
        >
          开始发牌
        </button>
        
        <!-- 邀请好友按钮（仅房主可见） -->
        <button 
          v-if="isHost && gameState === 'idle'" 
          class="btn-secondary" 
          @click="openInviteModal"
        >
          邀请好友
        </button>
        
        <!-- 普通玩家操作按钮 -->
        <button 
          v-else 
          class="btn-primary" 
          @click="viewMyRole"
          :disabled="gameState === 'idle' || hasViewedRole"
        >
          查看我的身份
        </button>
        
        <!-- 游戏结束按钮（仅发牌后可见） -->
        <button 
          v-if="isHost && (gameState === 'dealing' || gameState === 'all_confirmed' || gameState === 'judge_view')" 
          class="btn-secondary" 
          @click="resetGame"
        >
          游戏结束
        </button>
        
        <!-- 退出房间按钮 -->
        <button class="btn-tertiary" @click="leaveRoom">
          退出房间
        </button>
      </view>
      
      <!-- 邀请好友弹窗 -->
      <view v-if="showInviteModal" class="invite-overlay" @click="closeInviteModal">
        <view class="invite-container" @click.stop>
          <text class="invite-title">邀请好友</text>
          
          <view class="invite-content">
            <view class="room-info-section">
              <text class="room-id-label">房间号:</text>
              <text class="room-id-value">{{ currentRoom.roomId }}</text>
            </view>
            
            <view class="qr-code-section">
              <text class="qr-code-label">扫描二维码加入:</text>
              <view class="qr-code-placeholder">
                <text class="qr-code-text">{{ qrCodeUrl }}</text>
              </view>
            </view>
            
            <view class="share-link-section">
              <text class="share-link-label">分享链接:</text>
              <text class="share-link-value">{{ shareLink }}</text>
              <button class="btn-secondary small" @click="copyShareLink">
                复制链接
              </button>
            </view>
          </view>
          
          <view class="invite-actions">
            <button class="btn-secondary" @click="closeInviteModal">
              取消
            </button>
            <button class="btn-primary" @click="shareToFriends">
              一键分享
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/store/room'
import { WerewolfGame } from '@/store/game/werewolf'
import { getAllPresets, getPresetByPlayerCount } from '@/store/game/presets'
import { getCampIcon } from '@/utils/werewolfConfig'
import networkManager from '@/api/network'

const roomStore = useRoomStore()
const game = new WerewolfGame()

// 房间相关状态
const roomIdInput = ref('')
const playerName = ref('')
const showRoleCard = ref(false)
const cardFlipped = ref(false)
const currentRole = ref(null)
const currentPlayerNumber = ref(0)
const hasViewedRole = ref(false)

// 游戏配置状态
const configMode = ref('preset')
const playerCount = ref(9)
const selectedPreset = ref(null)
const winCondition = ref('slaughter_side')

// 网络相关状态
const showInviteModal = ref(false)
const shareLink = ref('')
const qrCodeUrl = ref('')

// 计算属性
const networkStatus = computed(() => roomStore.networkStatus)
const connectionStatusText = computed(() => {
  if (networkStatus.value === 'connected') {
    return '已连接'
  } else if (networkStatus.value === 'connecting') {
    return '连接中...'
  } else {
    return '未连接'
  }
})

const isHost = computed(() => roomStore.isHost)
const playerCountText = computed(() => {
  if (!roomStore.currentRoom) return '0/8'
  return `${roomStore.currentRoom.players.length}/8`
})

// 角色配置
const roleConfig = ref([
  { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
  { id: 'whiteWolfKing', name: '白狼王', icon: '👑', count: 0 },
  { id: 'wolfBeauty', name: '狼美人', icon: '💃', count: 0 },
  { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
  { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
  { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
  { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
  { id: 'idiot', name: '白痴', icon: '🤪', count: 0 },
  { id: 'knight', name: '骑士', icon: '⚔️', count: 0 },
  { id: 'villager', name: '村民', icon: '👤', count: 2 }
])

// 计算属性
const isInRoom = computed(() => roomStore.isInRoom)
const currentRoom = computed(() => roomStore.currentRoom)
const gameState = computed(() => game.getGameState())
const gameStatusText = computed(() => {
  if (gameState.value === 'idle') return '准备中'
  if (gameState.value === 'dealing') return '发牌中'
  if (gameState.value === 'all_confirmed') return '所有玩家已确认'
  if (gameState.value === 'judge_view') return '法官视角'
  return '准备中'
})

const availablePresets = computed(() => {
  return getAllPresets().filter(p => p.playerCount === playerCount.value)
})

const totalRoles = computed(() => {
  return roleConfig.value.reduce((sum, role) => sum + role.count, 0)
})



// 玩家头像
const getPlayerAvatar = (player) => {
  const avatars = ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦']
  const index = currentRoom.value.players.indexOf(player) % avatars.length
  return avatars[index]
}

// 生命周期
onMounted(() => {
  const savedRoom = roomStore.loadCurrentRoom()
  if (savedRoom) {
    // 恢复玩家名称
    if (savedRoom.players.length > 0) {
      playerName.value = savedRoom.players[0].name
    }
    // 恢复胜利条件
    if (savedRoom.winCondition) {
      winCondition.value = savedRoom.winCondition
    }
    // 恢复板子设置
    if (savedRoom.preset) {
      const preset = savedRoom.preset
      selectedPreset.value = preset
      playerCount.value = preset.playerCount
      game.setPreset(preset)
    }
  }
  
  const defaultPreset = getPresetByPlayerCount(9)
  if (defaultPreset && !selectedPreset.value) {
    selectPreset(defaultPreset)
  }
  
  // 注册网络事件
  registerNetworkEvents()
})

onUnmounted(() => {
  // 清理网络连接
  networkManager.disconnect()
})

// 注册网络事件
const registerNetworkEvents = () => {
  // 注册房间更新事件
  roomStore.registerNetworkEvent('room_updated', (data) => {
    console.log('房间更新:', data)
    // 可以在这里更新本地状态
  })
  
  // 注册玩家加入事件
  roomStore.registerNetworkEvent('player_joined', (data) => {
    console.log('玩家加入:', data)
    // 可以在这里更新玩家列表
  })
  
  // 注册玩家离开事件
  roomStore.registerNetworkEvent('player_left', (data) => {
    console.log('玩家离开:', data)
    // 可以在这里更新玩家列表
  })
  
  // 注册游戏开始事件
  roomStore.registerNetworkEvent('game_started', (data) => {
    console.log('游戏开始:', data)
    // 可以在这里更新游戏状态
  })
  
  // 注册重连失败事件
  roomStore.registerNetworkEvent('reconnect_failed', () => {
    console.log('重连失败')
    uni.showToast({ title: '网络连接失败，请重新加入房间', icon: 'none' })
  })
}

// 房间操作
const createRoom = async () => {
  if (!playerName.value) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  
  try {
    await roomStore.createRoom('狼人杀房间', winCondition.value, {
      hostName: playerName.value
    })
    uni.showToast({ title: '房间创建成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '创建失败', icon: 'none' })
  }
}

const joinRoom = async () => {
  if (!roomIdInput.value || !playerName.value) {
    uni.showToast({ title: '请输入房间号和昵称', icon: 'none' })
    return
  }
  
  const result = await roomStore.joinRoom(roomIdInput.value, playerName.value)
  if (result.success) {
    uni.showToast({ title: '加入房间成功', icon: 'success' })
  } else {
    uni.showToast({ title: result.message, icon: 'none' })
  }
}

const leaveRoom = async () => {
  await roomStore.leaveRoom()
  resetGameState()
  uni.showToast({ title: '已退出房间', icon: 'success' })
}

// 游戏操作
const startGame = async () => {
  if (currentRoom.value.players.length < 6) {
    uni.showToast({ title: '玩家人数不足6人', icon: 'none' })
    return
  }
  
  if (currentRoom.value.players.length !== playerCount.value) {
    uni.showToast({ title: '玩家人数与房间设置不一致', icon: 'none' })
    return
  }
  
  if (configMode.value === 'custom' && totalRoles.value !== playerCount.value) {
    uni.showToast({ title: '角色数量不匹配', icon: 'none' })
    return
  }
  
  // 重置玩家查看状态
  currentRoom.value.players.forEach(player => {
    player.hasViewedRole = false
  })
  await roomStore.updateRoom(currentRoom.value)
  
  // 配置游戏
  if (configMode.value === 'custom') {
    game.setCustomRoles(roleConfig.value)
  }
  
  // 发牌
  game.dealCards()
  
  uni.showToast({ title: '发牌完成', icon: 'success' })
}

const resetGame = async () => {
  game.resetGame()
  
  // 重置玩家查看状态
  currentRoom.value.players.forEach(player => {
    player.hasViewedRole = false
  })
  await roomStore.updateRoom(currentRoom.value)
  
  resetGameState()
  uni.showToast({ title: '游戏已结束', icon: 'success' })
}

const viewMyRole = () => {
  if (gameState.value === 'idle') {
    uni.showToast({ title: '游戏尚未开始', icon: 'none' })
    return
  }
  
  if (hasViewedRole.value) {
    uni.showToast({ title: '你已经查看过身份', icon: 'none' })
    return
  }
  
  const playerIndex = currentRoom.value.players.findIndex(p => p.name === playerName.value)
  if (playerIndex === -1) {
    uni.showToast({ title: '玩家不在房间中', icon: 'none' })
    return
  }
  
  const card = game.dealtCards[playerIndex]
  if (!card) {
    uni.showToast({ title: '未找到你的身份卡', icon: 'none' })
    return
  }
  
  currentRole.value = card.role
  currentPlayerNumber.value = playerIndex + 1
  showRoleCard.value = true
  
  // 延迟翻转卡片，增加动画效果
  setTimeout(() => {
    cardFlipped.value = true
  }, 100)
}

const confirmRole = async () => {
  cardFlipped.value = false
  showRoleCard.value = false
  hasViewedRole.value = true
  
  // 更新玩家查看状态
  const playerIndex = currentRoom.value.players.findIndex(p => p.name === playerName.value)
  if (playerIndex !== -1) {
    currentRoom.value.players[playerIndex].hasViewedRole = true
    await roomStore.updateRoom(currentRoom.value)
  }
  
  // 检查是否所有玩家都已查看
  const allViewed = currentRoom.value.players.every(p => p.hasViewedRole)
  if (allViewed) {
    game.setGameState('all_confirmed')
  }
}

const closeRoleCard = () => {
  if (cardFlipped.value) {
    cardFlipped.value = false
    setTimeout(() => {
      showRoleCard.value = false
    }, 300)
  } else {
    showRoleCard.value = false
  }
}

// 配置操作
const decreasePlayers = () => {
  if (playerCount.value > 6) {
    playerCount.value--
    const preset = getPresetByPlayerCount(playerCount.value)
    if (preset) {
      selectPreset(preset)
    }
  }
}

const increasePlayers = () => {
  if (playerCount.value < 18) {
    playerCount.value++
    const preset = getPresetByPlayerCount(playerCount.value)
    if (preset) {
      selectPreset(preset)
    }
  }
}

const selectPreset = (preset) => {
  selectedPreset.value = preset
  playerCount.value = preset.playerCount
  game.setPreset(preset)
  if (currentRoom.value) {
    currentRoom.value.preset = preset
    currentRoom.value.roles = preset.roles
    roomStore.updateRoom(currentRoom.value)
  }
}

const decreaseRole = (id) => {
  const role = roleConfig.value.find(r => r.id === id)
  if (role && role.count > 0) {
    role.count--
    if (currentRoom.value) {
      currentRoom.value.preset = null
      currentRoom.value.roles = roleConfig.value
      roomStore.updateRoom(currentRoom.value)
    }
  }
}

const increaseRole = (id) => {
  const role = roleConfig.value.find(r => r.id === id)
  if (role) {
    role.count++
    if (currentRoom.value) {
      currentRoom.value.preset = null
      currentRoom.value.roles = roleConfig.value
      roomStore.updateRoom(currentRoom.value)
    }
  }
}

// 游戏状态
const gameRound = ref(1)
const gameResult = ref(null)
const showResultModal = ref(false)

// 处理击杀玩家
const handleKillPlayer = (player) => {
  uni.showModal({
    title: '确认击杀',
    content: `确认让玩家 ${player.name} 击杀出局吗？`,
    success: async (res) => {
      if (res.confirm) {
        await markPlayerDead(player, 'killed')
      }
    }
  })
}

// 处理投票玩家
const handleVotePlayer = (player) => {
  uni.showModal({
    title: '确认投票',
    content: `确认让玩家 ${player.name} 投票出局吗？`,
    success: async (res) => {
      if (res.confirm) {
        await markPlayerDead(player, 'voted')
      }
    }
  })
}

// 处理复活玩家
const handleRevivePlayer = (player) => {
  uni.showModal({
    title: '确认复活',
    content: `确认复活玩家 ${player.name} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        player.isAlive = true
        player.deathType = null
        player.deathRound = null
        await roomStore.updateRoom(currentRoom.value)
        uni.showToast({ title: '复活成功', icon: 'success' })
      }
    }
  })
}

// 标记玩家死亡
const markPlayerDead = async (player, deathType) => {
  // 检查是否是白痴被投票
  if (player.role && player.role.id === 'idiot' && deathType === 'voted') {
    // 白痴胜利
    endGame('idiot_win', player)
    return
  }
  
  // 普通死亡
  player.isAlive = false
  player.deathType = deathType
  player.deathRound = gameRound.value
  
  await roomStore.updateRoom(currentRoom.value)
  
  // 检查游戏结果
  checkGameResult()
}

// 检查游戏结果
const checkGameResult = () => {
  const players = currentRoom.value.players
  
  // 计算存活人数
  const alivePlayers = players.filter(p => p.isAlive)
  const aliveWolves = alivePlayers.filter(p => p.role && p.role.camp === 'wolf')
  const aliveGods = alivePlayers.filter(p => p.role && p.role.camp === 'god')
  const aliveVillagers = alivePlayers.filter(p => p.role && p.role.camp === 'villager')
  
  // 检查狼人是否全灭
  if (aliveWolves.length === 0) {
    endGame('good_win')
    return
  }
  
  // 检查胜利条件
  const winCondition = currentRoom.value.winCondition || 'slaughter_side'
  
  if (winCondition === 'slaughter_side') {
    // 屠边模式：神职全灭或平民全灭
    if (aliveGods.length === 0 || aliveVillagers.length === 0) {
      endGame('wolf_win')
      return
    }
  } else if (winCondition === 'slaughter_all') {
    // 屠城模式：所有好人全灭
    if (aliveGods.length === 0 && aliveVillagers.length === 0) {
      endGame('wolf_win')
      return
    }
  }
}

// 结束游戏
const endGame = (result, idiotPlayer = null) => {
  gameResult.value = result
  showResultModal.value = true
  
  // 播放胜利动画
  if (result === 'idiot_win') {
    // 白痴胜利特效
    uni.showToast({
      title: `${idiotPlayer.name} (白痴) 获得胜利！`,
      icon: 'none',
      duration: 2000
    })
  }
}

// 再来一局
const playAgain = () => {
  resetGameState()
  showResultModal.value = false
  gameResult.value = null
  gameRound.value = 1
  
  // 重置玩家状态
  currentRoom.value.players.forEach(player => {
    player.isAlive = true
    player.deathType = null
    player.deathRound = null
  })
  roomStore.updateRoom(currentRoom.value)
}

// 返回房间
const backToRoom = () => {
  showResultModal.value = false
  gameResult.value = null
}

// 辅助函数
const resetGameState = () => {
  game.resetGame()
  showRoleCard.value = false
  cardFlipped.value = false
  currentRole.value = null
  currentPlayerNumber.value = 0
  hasViewedRole.value = false
}

const isPlayerHost = (player) => {
  return currentRoom.value.players[0] === player
}

// 处理胜利条件变化
const handleWinConditionChange = (condition) => {
  winCondition.value = condition
  if (currentRoom.value) {
    currentRoom.value.winCondition = condition
    roomStore.updateRoom(currentRoom.value)
  }
}

// 打开邀请好友界面
const openInviteModal = () => {
  shareLink.value = roomStore.generateShareLink()
  qrCodeUrl.value = roomStore.generateQRCode()
  showInviteModal.value = true
}

// 关闭邀请好友界面
const closeInviteModal = () => {
  showInviteModal.value = false
}

// 复制分享链接
const copyShareLink = () => {
  uni.setClipboardData({
    data: shareLink.value,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
    }
  })
}

// 分享给好友
const shareToFriends = () => {
  // 实际项目中需要使用uni.share API
  uni.showToast({ title: '分享功能已触发', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.werewolf-room {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30rpx;
}

/* 房间创建/加入界面 */
.room-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.entry-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.entry-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin-bottom: 40rpx;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.5);
}

.input-section {
  margin-bottom: 30rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #e0e0e0;
  margin-bottom: 12rpx;
}

.input-group {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 28rpx;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #ffd700;
    box-shadow: 0 0 20rpx rgba(255, 215, 0, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 40rpx;
}

/* 房间内界面 */
.room-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-header {
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.room-id {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffd700;
}

.player-count {
  font-size: 24rpx;
  color: #e0e0e0;
}

.room-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(76, 175, 80, 0.2);
  border: 1rpx solid rgba(76, 175, 80, 0.4);
  
  &.playing {
    background: rgba(255, 152, 0, 0.2);
    border: 1rpx solid rgba(255, 152, 0, 0.4);
  }
}

.status-text {
  font-size: 24rpx;
  color: #4caf50;
  
  .room-status.playing & {
    color: #ff9800;
  }
}

.player-list {
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
}

.list-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24rpx;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.player-item {
  background: rgba(255, 255, 255, 0.15);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.2);
  }
  
  &.host {
    border-color: #ffd700;
    box-shadow: 0 0 15rpx rgba(255, 215, 0, 0.3);
  }
  
  &.viewed {
    background: rgba(76, 175, 80, 0.2);
    border-color: rgba(76, 175, 80, 0.4);
  }
}

.player-avatar {
  position: relative;
  margin-bottom: 12rpx;
}

.avatar-icon {
  font-size: 48rpx;
}

.crown-icon {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  font-size: 24rpx;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.player-name {
  display: block;
  font-size: 24rpx;
  color: #ffffff;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.viewed-status {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  font-size: 20rpx;
  color: #4caf50;
  font-weight: bold;
}

/* 游戏配置 */
.config-section {
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 30rpx;
}

.config-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 30rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #e0e0e0;
  
  &.active {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    font-weight: 600;
    border: 1rpx solid rgba(255, 215, 0, 0.4);
  }
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.config-label {
  font-size: 28rpx;
  color: #e0e0e0;
}

.config-value {
  font-size: 28rpx;
  color: #ffd700;
  font-weight: 600;
}

.stepper {
  display: flex;
  align-items: center;
  
  &.small {
    .stepper-btn {
      width: 48rpx;
      height: 48rpx;
      font-size: 28rpx;
    }
    
    .stepper-value {
      min-width: 60rpx;
      font-size: 28rpx;
    }
  }
}

.stepper-btn {
  width: 64rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  
  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

.stepper-value {
  min-width: 80rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
}

.preset-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.preset-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  
  &.active {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }
  
  &:active {
    background: rgba(255, 215, 0, 0.1);
  }
}

.preset-info {
  margin-bottom: 16rpx;
}

.preset-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6rpx;
}

.preset-desc {
  display: block;
  font-size: 24rpx;
  color: #e0e0e0;
}

.preset-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.role-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.role-more {
  font-size: 24rpx;
  color: #e0e0e0;
  padding: 8rpx 0;
}

.role-config {
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
  padding-top: 20rpx;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
}

.role-info {
  display: flex;
  align-items: center;
}

.role-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.role-name {
  font-size: 28rpx;
  color: #ffffff;
}

.total-info {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.total-text {
  font-size: 28rpx;
  color: #e0e0e0;
}

.total-hint {
  display: block;
  font-size: 24rpx;
  color: #ff6b6b;
  margin-top: 8rpx;
}

/* 胜利条件选择 */
.room-info-section {
  margin-bottom: 30rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.room-id-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-id-with-share {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.room-id-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 215, 0, 0.3);
}

.share-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

.win-condition-section {
  margin-bottom: 30rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.radio-group {
  margin-top: 16rpx;
}

.radio-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    background: rgba(255, 215, 0, 0.05);
  }
  
  &.active {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }
  
  &:active {
    background: rgba(255, 215, 0, 0.1);
  }
}

.radio-label {
  font-size: 28rpx;
  color: #ffffff;
  margin-left: 12rpx;
  margin-top: 4rpx;
}

.radio-desc {
  font-size: 24rpx;
  color: #e0e0e0;
  margin-left: 48rpx;
  margin-top: 4rpx;
}

/* 玩家死亡状态 */
.player-item {
  position: relative;
  transition: all 0.3s ease;
  
  &.dead {
    opacity: 0.6;
    filter: grayscale(100%);
    
    .player-name {
      text-decoration: line-through;
    }
  }
}

.death-icon {
  position: absolute;
  bottom: -8rpx;
  right: -8rpx;
  font-size: 24rpx;
  animation: pulse 1.5s infinite;
}

/* 玩家操作按钮 */
.player-actions {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  flex: 1;
  min-width: 80rpx;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  text-align: center;
  transition: all 0.3s ease;
  
  &.kill-btn {
    background: rgba(255, 99, 71, 0.2);
    color: #ff6347;
    border: 1rpx solid rgba(255, 99, 71, 0.4);
  }
  
  &.vote-btn {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
    border: 1rpx solid rgba(255, 152, 0, 0.4);
  }
  
  &.revive-btn {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1rpx solid rgba(76, 175, 80, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

/* 结算结果弹窗 */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.result-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  max-width: 80vw;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.result-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
  text-shadow: 0 2rpx 10rpx rgba(255, 215, 0, 0.5);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.winner-section,
.reason-section,
.players-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.winner-label,
.reason-label,
.players-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.winner-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
}

.reason-text {
  font-size: 24rpx;
  color: #e0e0e0;
  line-height: 1.4;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-height: 300rpx;
  overflow-y: auto;
}

.player-record {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #e0e0e0;
  flex-wrap: wrap;
}

.player-name {
  font-weight: 600;
  color: #ffffff;
}

.player-role {
  color: #ffd700;
}

.player-status {
  color: #e0e0e0;
  flex: 1;
}

.result-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.result-actions .btn-primary,
.result-actions .btn-secondary {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
}

/* 身份卡片 */
.role-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.role-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  padding: 40rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.role-card {
  width: 340rpx;
  min-height: 500rpx;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
  --card-color: #666666;
  
  &.flipped {
    transform: rotateY(180deg);
  }
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  min-height: 500rpx;
  backface-visibility: hidden;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.card-front {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border: 2rpx solid #ffed4e;
}

.card-number {
  font-size: 72rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.card-hint {
  font-size: 24rpx;
  opacity: 0.8;
}

.card-back {
  background: var(--card-color);
  transform: rotateY(180deg);
  color: #ffffff;
  border: 2rpx solid var(--card-color);
  padding: 30rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.camp-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.camp-icon {
  font-size: 24rpx;
}

.camp-name {
  font-size: 24rpx;
  font-weight: 600;
}

.card-back .role-icon {
  font-size: 100rpx;
  margin: 10rpx 0;
}

.card-back .role-name {
  font-size: 32rpx;
  font-weight: bold;
  margin: 10rpx 0;
}

.card-divider {
  width: 80%;
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 10rpx 0;
}

.skills-section, .strategy-section {
  width: 100%;
  text-align: left;
}

.section-title {
  font-size: 20rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.skill-item {
  font-size: 16rpx;
  line-height: 1.4;
  display: block;
}

.strategy-text {
  font-size: 16rpx;
  line-height: 1.4;
  text-align: left;
}

.confirm-btn {
  width: 200rpx;
  margin-top: 20rpx;
}

/* 操作栏 */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  border: none;
  transition: all 0.3s ease;
  
  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.btn-secondary {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  text-align: center;
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(0.98);
  }
}

.btn-tertiary {
  width: 100%;
  background: rgba(255, 99, 71, 0.2);
  color: #ff6347;
  border: 2rpx solid rgba(255, 99, 71, 0.4);
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  text-align: center;
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(255, 99, 71, 0.3);
    transform: scale(0.98);
  }
}

/* 网络状态样式 */
.network-status {
  font-size: 20rpx;
  color: #e0e0e0;
  margin-top: 4rpx;
  
  &.connected {
    color: #4caf50;
  }
  
  &.connecting {
    color: #ff9800;
  }
  
  &.disconnected {
    color: #f44336;
  }
}

/* 邀请好友弹窗 */
.invite-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.invite-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  max-width: 80vw;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.invite-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
  text-shadow: 0 2rpx 10rpx rgba(255, 215, 0, 0.5);
}

.invite-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room-info-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-id-label {
  font-size: 24rpx;
  color: #e0e0e0;
}

.room-id-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffd700;
}

.qr-code-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.qr-code-label {
  font-size: 24rpx;
  color: #e0e0e0;
  align-self: flex-start;
}

.qr-code-placeholder {
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-code-text {
  font-size: 14rpx;
  color: #e0e0e0;
  text-align: center;
  padding: 10rpx;
}

.share-link-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.share-link-label {
  font-size: 24rpx;
  color: #e0e0e0;
}

.share-link-value {
  font-size: 20rpx;
  color: #ffffff;
  word-break: break-all;
  padding: 12rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.invite-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.invite-actions .btn-primary,
.invite-actions .btn-secondary {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
}

.btn-secondary.small {
  width: auto;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  align-self: flex-start;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8rpx;
  height: 8rpx;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4rpx;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.5);
  border-radius: 4rpx;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.7);
}
</style>