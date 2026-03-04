<template>
  <view class="avalon-room">
    <!-- 房间创建/加入界面 -->
    <view v-if="!isInRoom" class="room-entry">
      <view class="entry-card">
        <text class="entry-title">阿瓦隆房间</text>
        
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
          <text class="player-count">{{ currentRoom.players.length }}/10 人</text>
          <text class="network-status" :class="networkStatus">网络: {{ connectionStatusText }}</text>
        </view>
        <view class="room-status" :class="{ 'playing': gameState !== 'idle' }">
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
            :class="['player-item', { 'host': isPlayerHost(player), 'leader': index === currentLeaderIndex }]"
          >
            <view class="player-avatar">
              <text class="avatar-icon">{{ getPlayerAvatar(player) }}</text>
              <view v-if="isPlayerHost(player)" class="crown-icon">👑</view>
              <view v-if="index === currentLeaderIndex" class="leader-icon">👑</view>
            </view>
            <text class="player-name">{{ player.name }}</text>
            <text v-if="player.avalonData?.role" class="player-role">{{ getRoleName(player.avalonData.role) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 游戏配置（仅房主可见） -->
      <view v-if="isHost && gameState === 'idle'" class="config-section card">
        <text class="section-title">游戏配置</text>
        
        <view class="config-item">
          <text class="config-label">玩家人数</text>
          <view class="stepper">
            <view class="stepper-btn" @click="decreasePlayers">-</view>
            <text class="stepper-value">{{ playerCount }}人</text>
            <view class="stepper-btn" @click="increasePlayers">+</view>
          </view>
        </view>
        
        <view class="config-item">
          <text class="config-label">角色配置</text>
          <view class="role-config">
            <view class="role-item" v-for="role in avalonRoles" :key="role.id">
              <view class="role-info">
                <text class="role-icon">{{ role.icon }}</text>
                <text class="role-name">{{ role.name }}</text>
              </view>
              <text class="role-count">{{ getRoleCount(role.id) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 游戏阶段界面 -->
      <view v-if="gameState !== 'idle'" class="game-phase card">
        <text class="phase-title">{{ currentPhaseText }}</text>
        
        <!-- 组队阶段 -->
        <view v-if="gameState === 'team_building'" class="phase-content">
          <text class="phase-info">当前队长: {{ getPlayerName(currentLeaderIndex) }}</text>
          <text class="phase-info">本轮任务需要: {{ getQuestPlayerCount() }}人</text>
          
          <view class="team-building">
            <text class="section-label">选择队员:</text>
            <view class="player-select-list">
              <view 
                v-for="(player, index) in currentRoom.players" 
                :key="player.id"
                :class="['player-select-item', { 'selected': selectedTeam.includes(player.id), 'disabled': index === currentLeaderIndex }]"
                @click="toggleTeamMember(player.id, index)"
              >
                <text class="player-select-icon">{{ getPlayerAvatar(player) }}</text>
                <text class="player-select-name">{{ player.name }}</text>
              </view>
            </view>
            
            <button class="btn-primary" @click="confirmTeam" :disabled="selectedTeam.length !== getQuestPlayerCount() - 1">
              确认队伍
            </button>
          </view>
        </view>
        
        <!-- 投票阶段 -->
        <view v-if="gameState === 'voting'" class="phase-content">
          <text class="phase-info">当前队伍:</text>
          <view class="current-team">
            <text class="team-player" v-for="playerId in currentTeam" :key="playerId">
              {{ getPlayerNameById(playerId) }}
            </text>
          </view>
          
          <view class="voting-section">
            <text class="section-label">投票:</text>
            <view class="vote-buttons">
              <button class="btn-primary" @click="castVote(true)">
                赞成
              </button>
              <button class="btn-secondary" @click="castVote(false)">
                反对
              </button>
            </view>
          </view>
        </view>
        
        <!-- 任务阶段 -->
        <view v-if="gameState === 'questing'" class="phase-content">
          <text class="phase-info">任务进行中...</text>
          <text class="phase-info">队员:</text>
          <view class="current-team">
            <text class="team-player" v-for="playerId in currentTeam" :key="playerId">
              {{ getPlayerNameById(playerId) }}
            </text>
          </view>
          
          <view v-if="isInCurrentTeam" class="quest-section">
            <text class="section-label">提交任务卡:</text>
            <view class="quest-buttons">
              <button class="btn-primary" @click="submitQuestResult(true)">
                成功
              </button>
              <button class="btn-secondary" @click="submitQuestResult(false)">
                失败
              </button>
            </view>
          </view>
        </view>
        
        <!-- 刺杀阶段 -->
        <view v-if="gameState === 'assassination'" class="phase-content">
          <text class="phase-info">游戏结束！</text>
          <text class="phase-info">坏人阵营有机会刺杀梅林...</text>
          
          <view v-if="isAssassin" class="assassination-section">
            <text class="section-label">刺客请选择刺杀目标:</text>
            <view class="player-select-list">
              <view 
                v-for="(player, index) in currentRoom.players" 
                :key="player.id"
                :class="['player-select-item', { 'selected': selectedAssassinationTarget === player.id }]"
                @click="selectAssassinationTarget(player.id)"
              >
                <text class="player-select-icon">{{ getPlayerAvatar(player) }}</text>
                <text class="player-select-name">{{ player.name }}</text>
              </view>
            </view>
            
            <button class="btn-primary" @click="confirmAssassination" :disabled="!selectedAssassinationTarget">
              确认刺杀
            </button>
          </view>
        </view>
        
        <!-- 游戏结束 -->
        <view v-if="gameState === 'game_over'" class="phase-content">
          <text class="game-over-title">{{ gameResultText }}</text>
          <text class="game-over-reason">{{ gameResultReason }}</text>
          
          <button class="btn-primary" @click="resetGame">
            再来一局
          </button>
        </view>
      </view>
      
      <!-- 底部操作栏 -->
      <view class="action-section">
        <!-- 房主操作按钮 -->
        <button 
          v-if="isHost" 
          class="btn-primary" 
          @click="startGame"
          :disabled="gameState !== 'idle' || currentRoom.players.length < 5 || currentRoom.players.length > 10"
        >
          开始游戏
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
        
        <!-- 游戏结束按钮（仅游戏中可见） -->
        <button 
          v-if="isHost && gameState !== 'idle'" 
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
      
      <!-- 角色卡片展示 -->
      <view v-if="showRoleCard" class="role-card-overlay" @click="closeRoleCard">
        <view class="role-card-container" @click.stop>
          <view :class="['role-card', { 'flipped': cardFlipped }]" :style="{ '--card-color': getRoleColor(currentRole) }">
            <view class="card-front">
              <text class="card-number">{{ currentPlayerNumber }}号</text>
              <text class="card-hint">点击查看身份</text>
            </view>
            <view class="card-back">
              <view class="camp-info">
                <text class="camp-icon">{{ getCampIcon(currentRole?.camp) }}</text>
                <text class="camp-name">{{ currentRole?.camp === 'good' ? '好人阵营' : '坏人阵营' }}</text>
              </view>
              <text class="role-icon">{{ currentRole?.icon }}</text>
              <text class="role-name">【{{ currentRole?.name }}】</text>
              <view class="card-divider"></view>
              <view class="skills-section">
                <text class="section-title">🎯 角色技能</text>
                <text class="skill-text">{{ currentRole?.skill }}</text>
              </view>
              <view class="card-divider"></view>
              <view class="tips-section">
                <text class="section-title">💡 玩法建议</text>
                <text class="tips-text">{{ currentRole?.tips }}</text>
              </view>
              <view v-if="currentRole?.seenPlayers && currentRole.seenPlayers.length > 0" class="card-divider"></view>
              <view v-if="currentRole?.seenPlayers && currentRole.seenPlayers.length > 0" class="seen-section">
                <text class="section-title">👁️ 你能看到</text>
                <text class="seen-text" v-for="playerId in currentRole.seenPlayers" :key="playerId">
                  {{ getPlayerNameById(playerId) }}
                </text>
              </view>
            </view>
          </view>
          <button class="btn-primary confirm-btn" @click="confirmRole">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/store/room'
import { AvalonGame } from '@/store/game/avalon'
import networkManager from '@/api/network'

const roomStore = useRoomStore()
const game = new AvalonGame()

// 房间相关状态
const roomIdInput = ref('')
const playerName = ref('')
const showRoleCard = ref(false)
const cardFlipped = ref(false)
const currentRole = ref(null)
const currentPlayerNumber = ref(0)
const hasViewedRole = ref(false)

// 游戏配置状态
const playerCount = ref(5)

// 网络相关状态
const showInviteModal = ref(false)
const shareLink = ref('')
const qrCodeUrl = ref('')

// 游戏流程状态
const selectedTeam = ref([])
const selectedAssassinationTarget = ref(null)

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
const isInRoom = computed(() => roomStore.isInRoom)
const currentRoom = computed(() => roomStore.currentRoom)
const gameState = computed(() => game.getGameState())
const gameStatusText = computed(() => {
  if (gameState.value === 'idle') return '准备中'
  if (gameState.value === 'dealing') return '发牌中'
  if (gameState.value === 'team_building') return '组队阶段'
  if (gameState.value === 'voting') return '投票阶段'
  if (gameState.value === 'questing') return '任务阶段'
  if (gameState.value === 'assassination') return '刺杀阶段'
  if (gameState.value === 'game_over') return '游戏结束'
  return '准备中'
})

const currentPhaseText = computed(() => {
  if (gameState.value === 'dealing') return '发牌阶段'
  if (gameState.value === 'team_building') return '组队阶段'
  if (gameState.value === 'voting') return '投票阶段'
  if (gameState.value === 'questing') return '任务阶段'
  if (gameState.value === 'assassination') return '刺杀阶段'
  if (gameState.value === 'game_over') return '游戏结束'
  return '准备中'
})

const currentLeaderIndex = computed(() => {
  return currentRoom.value?.avalonData?.leaderIndex || 0
})

const currentTeam = computed(() => {
  return currentRoom.value?.avalonData?.team || []
})

const isInCurrentTeam = computed(() => {
  if (!currentTeam.value || gameState.value !== 'questing') return false
  const player = currentRoom.value.players.find(p => p.name === playerName.value)
  return player && currentTeam.value.includes(player.id)
})

const isAssassin = computed(() => {
  if (gameState.value !== 'assassination') return false
  const player = currentRoom.value.players.find(p => p.name === playerName.value)
  return player && player.avalonData?.role === 'assassin'
})

const gameResultText = computed(() => {
  const result = currentRoom.value?.avalonData?.gameResult
  if (result === 'good_win') return '🎉 好人阵营获胜！'
  if (result === 'evil_win') return '🎉 坏人阵营获胜！'
  return '游戏结束'
})

const gameResultReason = computed(() => {
  const reason = currentRoom.value?.avalonData?.gameResultReason
  return reason || ''
})

// 阿瓦隆角色配置
const avalonRoles = [
  { id: 'merlin', name: '梅林', camp: 'good', icon: '🧙‍♂️', skill: '可以看到所有坏人（除了莫德雷德）', tips: '你的提示是好人获胜的关键，但切记不要表现得太明显，否则刺客会找到你。' },
  { id: 'percival', name: '派西维尔', camp: 'good', icon: '🧝', skill: '可以看到梅林和莫甘娜（但不知道具体谁是梅林）', tips: '你是梅林的盾牌，要保护好真正的梅林，迷惑刺客的判断。' },
  { id: 'loyal_servant', name: '忠臣', camp: 'good', icon: '🤴', skill: '无特殊技能', tips: '通过发言和投票，帮助好人阵营找出坏人。' },
  { id: 'assassin', name: '刺客', camp: 'evil', icon: '🗡️', skill: '游戏结束时，可以刺杀一名玩家，若刺中梅林则坏人翻盘', tips: '整局游戏观察谁的发言在暗中引导好人，那个人很可能就是梅林。' },
  { id: 'morgana', name: '莫甘娜', camp: 'evil', icon: '🧟‍♀️', skill: '在派西维尔眼中显示为梅林（混淆派西维尔）', tips: '你要假装自己是梅林，欺骗派西维尔保护你，从而暴露给刺客。' },
  { id: 'mordred', name: '莫德雷德', camp: 'evil', icon: '🦹', skill: '梅林看不到你（隐藏最深的坏人）', tips: '你是梅林的盲区，大胆发言，梅林查不到你，这是你的优势。' },
  { id: 'oberon', name: '奥伯伦', camp: 'evil', icon: '👺', skill: '不知道队友是谁，队友也不知道他（孤狼）', tips: '作为孤狼，你要独自判断形势，在不暴露队友的情况下破坏任务。' },
  { id: 'minion', name: '爪牙', camp: 'evil', icon: '👺', skill: '开局可以看到所有队友（除了奥伯伦）', tips: '配合队友行动，在关键投票中投反对票破坏任务。' }
]

// 玩家头像
const getPlayerAvatar = (player) => {
  const avatars = ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯']
  const index = currentRoom.value.players.indexOf(player) % avatars.length
  return avatars[index]
}

// 检查是否是房主
const isPlayerHost = (player) => {
  return currentRoom.value.players[0] === player
}

// 获取玩家名称
const getPlayerName = (index) => {
  if (!currentRoom.value || index >= currentRoom.value.players.length) return '未知'
  return currentRoom.value.players[index].name
}

// 根据ID获取玩家名称
const getPlayerNameById = (playerId) => {
  const player = currentRoom.value.players.find(p => p.id === playerId)
  return player ? player.name : '未知'
}

// 获取角色名称
const getRoleName = (roleId) => {
  const role = avalonRoles.find(r => r.id === roleId)
  return role ? role.name : ''
}

// 获取角色颜色
const getRoleColor = (role) => {
  if (!role) return '#666666'
  return role.camp === 'good' ? '#4caf50' : '#f44336'
}

// 获取阵营图标
const getCampIcon = (camp) => {
  return camp === 'good' ? '🌟' : '💀'
}

// 获取角色数量
const getRoleCount = (roleId) => {
  const config = getRoleConfigByPlayerCount(playerCount.value)
  return config[roleId] || 0
}

// 根据玩家人数获取角色配置
const getRoleConfigByPlayerCount = (count) => {
  switch (count) {
    case 5:
      return { merlin: 1, percival: 1, loyal_servant: 1, assassin: 1, morgana: 1 }
    case 6:
      return { merlin: 1, percival: 1, loyal_servant: 2, assassin: 1, morgana: 1 }
    case 7:
      return { merlin: 1, percival: 1, loyal_servant: 2, assassin: 1, morgana: 1, mordred: 1 }
    case 8:
      return { merlin: 1, percival: 1, loyal_servant: 3, assassin: 1, morgana: 1, mordred: 1 }
    case 9:
      return { merlin: 1, percival: 1, loyal_servant: 4, assassin: 1, morgana: 1, mordred: 1 }
    case 10:
      return { merlin: 1, percival: 1, loyal_servant: 4, assassin: 1, morgana: 1, mordred: 1, oberon: 1 }
    default:
      return { merlin: 1, percival: 1, loyal_servant: 1, assassin: 1, morgana: 1 }
  }
}

// 获取任务需要的玩家数量
const getQuestPlayerCount = () => {
  const round = currentRoom.value?.avalonData?.round || 1
  const count = currentRoom.value.players.length
  
  if (count <= 6) {
    const counts = [2, 3, 3, 3, 3]
    return counts[round - 1] || 3
  } else if (count <= 8) {
    const counts = [2, 3, 3, 4, 4]
    return counts[round - 1] || 4
  } else {
    const counts = [3, 4, 4, 5, 5]
    return counts[round - 1] || 5
  }
}

// 生命周期
onMounted(() => {
  const savedRoom = roomStore.loadCurrentRoom()
  if (savedRoom) {
    // 恢复玩家名称
    if (savedRoom.players.length > 0) {
      playerName.value = savedRoom.players[0].name
    }
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
    await roomStore.createRoom('阿瓦隆房间', 'slaughter_side', {
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
  if (currentRoom.value.players.length < 5 || currentRoom.value.players.length > 10) {
    uni.showToast({ title: '玩家人数必须在5-10人之间', icon: 'none' })
    return
  }
  
  // 初始化阿瓦隆数据
  if (!currentRoom.value.avalonData) {
    currentRoom.value.avalonData = {
      round: 1,
      leaderIndex: 0,
      team: [],
      votes: {},
      questResults: [],
      gameResult: null,
      gameResultReason: ''
    }
  }
  
  // 重置玩家查看状态
  currentRoom.value.players.forEach(player => {
    player.avalonData = player.avalonData || {
      role: null,
      seenPlayers: []
    }
  })
  await roomStore.updateRoom(currentRoom.value)
  
  // 配置游戏
  game.setPlayerCount(currentRoom.value.players.length)
  
  // 发牌
  game.dealCards()
  
  // 分配角色
  const dealtCards = game.dealtCards
  currentRoom.value.players.forEach((player, index) => {
    if (index < dealtCards.length) {
      player.avalonData.role = dealtCards[index].role
      player.avalonData.seenPlayers = dealtCards[index].seenPlayers
    }
  })
  
  await roomStore.updateRoom(currentRoom.value)
  
  game.setGameState('team_building')
  uni.showToast({ title: '发牌完成', icon: 'success' })
}

const resetGame = async () => {
  game.resetGame()
  
  // 重置游戏数据
  if (currentRoom.value) {
    currentRoom.value.avalonData = {
      round: 1,
      leaderIndex: 0,
      team: [],
      votes: {},
      questResults: [],
      gameResult: null,
      gameResultReason: ''
    }
    
    // 重置玩家状态
    currentRoom.value.players.forEach(player => {
      player.avalonData = {
        role: null,
        seenPlayers: []
      }
    })
    
    await roomStore.updateRoom(currentRoom.value)
  }
  
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
  
  const player = currentRoom.value.players.find(p => p.name === playerName.value)
  if (!player || !player.avalonData?.role) {
    uni.showToast({ title: '未找到你的身份', icon: 'none' })
    return
  }
  
  const role = avalonRoles.find(r => r.id === player.avalonData.role)
  if (!role) {
    uni.showToast({ title: '角色不存在', icon: 'none' })
    return
  }
  
  // 构建角色信息，包括能看到的玩家
  currentRole.value = {
    ...role,
    seenPlayers: player.avalonData.seenPlayers
  }
  currentPlayerNumber.value = currentRoom.value.players.indexOf(player) + 1
  showRoleCard.value = true
  
  // 延迟翻转卡片，增加动画效果
  setTimeout(() => {
    cardFlipped.value = true
  }, 100)
}

const confirmRole = () => {
  cardFlipped.value = false
  showRoleCard.value = false
  hasViewedRole.value = true
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
  if (playerCount.value > 5) {
    playerCount.value--
  }
}

const increasePlayers = () => {
  if (playerCount.value < 10) {
    playerCount.value++
  }
}

// 组队操作
const toggleTeamMember = (playerId, index) => {
  if (index === currentLeaderIndex) return // 队长自动加入
  
  const indexInTeam = selectedTeam.value.indexOf(playerId)
  if (indexInTeam === -1) {
    if (selectedTeam.value.length < getQuestPlayerCount() - 1) {
      selectedTeam.value.push(playerId)
    }
  } else {
    selectedTeam.value.splice(indexInTeam, 1)
  }
}

const confirmTeam = async () => {
  if (selectedTeam.value.length !== getQuestPlayerCount() - 1) {
    uni.showToast({ title: '请选择正确数量的队员', icon: 'none' })
    return
  }
  
  // 队长自动加入队伍
  const leaderId = currentRoom.value.players[currentLeaderIndex].id
  const team = [leaderId, ...selectedTeam.value]
  
  currentRoom.value.avalonData.team = team
  currentRoom.value.avalonData.votes = {}
  await roomStore.updateRoom(currentRoom.value)
  
  game.setGameState('voting')
  selectedTeam.value = []
}

// 投票操作
const castVote = async (approve) => {
  const player = currentRoom.value.players.find(p => p.name === playerName.value)
  if (!player) return
  
  currentRoom.value.avalonData.votes[player.id] = approve
  await roomStore.updateRoom(currentRoom.value)
  
  // 检查是否所有玩家都已投票
  const allVoted = currentRoom.value.players.every(p => currentRoom.value.avalonData.votes[p.id] !== undefined)
  if (allVoted) {
    // 计算投票结果
    const voteCount = Object.values(currentRoom.value.avalonData.votes)
    const approveCount = voteCount.filter(v => v).length
    const rejectCount = voteCount.length - approveCount
    
    if (approveCount > rejectCount) {
      // 投票通过，进入任务阶段
      game.setGameState('questing')
    } else {
      // 投票不通过，队长移交给下一位
      currentRoom.value.avalonData.leaderIndex = (currentRoom.value.avalonData.leaderIndex + 1) % currentRoom.value.players.length
      currentRoom.value.avalonData.team = []
      currentRoom.value.avalonData.votes = {}
      await roomStore.updateRoom(currentRoom.value)
      game.setGameState('team_building')
    }
  }
}

// 任务操作
const submitQuestResult = async (success) => {
  const player = currentRoom.value.players.find(p => p.name === playerName.value)
  if (!player) return
  
  // 坏人可以选择失败，好人只能选择成功
  const isEvil = player.avalonData.role && avalonRoles.find(r => r.id === player.avalonData.role).camp === 'evil'
  const actualResult = isEvil ? !success : success
  
  // 这里简化处理，实际应该收集所有队员的结果
  currentRoom.value.avalonData.questResults.push(actualResult ? 'success' : 'fail')
  
  // 检查游戏是否结束
  const failCount = currentRoom.value.avalonData.questResults.filter(r => r === 'fail').length
  const successCount = currentRoom.value.avalonData.questResults.filter(r => r === 'success').length
  
  if (failCount >= 3) {
    // 坏人胜利
    currentRoom.value.avalonData.gameResult = 'evil_win'
    currentRoom.value.avalonData.gameResultReason = '坏人阵营成功完成3次任务失败'
    game.setGameState('game_over')
  } else if (successCount >= 3) {
    // 好人胜利，但刺客有机会刺杀
    currentRoom.value.avalonData.gameResult = 'good_win'
    currentRoom.value.avalonData.gameResultReason = '好人阵营成功完成3次任务'
    game.setGameState('assassination')
  } else {
    // 进入下一轮
    currentRoom.value.avalonData.round++
    currentRoom.value.avalonData.leaderIndex = (currentRoom.value.avalonData.leaderIndex + 1) % currentRoom.value.players.length
    currentRoom.value.avalonData.team = []
    currentRoom.value.avalonData.votes = {}
    game.setGameState('team_building')
  }
  
  await roomStore.updateRoom(currentRoom.value)
}

// 刺杀操作
const selectAssassinationTarget = (playerId) => {
  selectedAssassinationTarget.value = playerId
}

const confirmAssassination = async () => {
  if (!selectedAssassinationTarget.value) return
  
  const targetPlayer = currentRoom.value.players.find(p => p.id === selectedAssassinationTarget.value)
  if (targetPlayer && targetPlayer.avalonData.role === 'merlin') {
    // 刺杀成功，坏人翻盘
    currentRoom.value.avalonData.gameResult = 'evil_win'
    currentRoom.value.avalonData.gameResultReason = '刺客成功刺杀梅林，坏人阵营翻盘'
  }
  
  game.setGameState('game_over')
  await roomStore.updateRoom(currentRoom.value)
  selectedAssassinationTarget.value = null
}

// 辅助函数
const resetGameState = () => {
  game.resetGame()
  showRoleCard.value = false
  cardFlipped.value = false
  currentRole.value = null
  currentPlayerNumber.value = 0
  hasViewedRole.value = false
  selectedTeam.value = []
  selectedAssassinationTarget.value = null
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
.avalon-room {
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
  
  &.leader {
    border-color: #4caf50;
    box-shadow: 0 0 15rpx rgba(76, 175, 80, 0.3);
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

.leader-icon {
  position: absolute;
  top: -8rpx;
  left: -8rpx;
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

.player-role {
  display: block;
  font-size: 20rpx;
  color: #ffd700;
  margin-top: 4rpx;
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

.config-item {
  margin-bottom: 30rpx;
}

.config-label {
  font-size: 28rpx;
  color: #e0e0e0;
  margin-bottom: 16rpx;
  display: block;
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

.role-config {
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
  padding-top: 20rpx;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
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
  font-size: 32rpx;
  margin-right: 12rpx;
}

.role-name {
  font-size: 24rpx;
  color: #ffffff;
}

.role-count {
  font-size: 24rpx;
  color: #ffd700;
  font-weight: 600;
}

/* 游戏阶段 */
.game-phase {
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
}

.phase-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffd700;
  margin-bottom: 24rpx;
  text-align: center;
}

.phase-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.phase-info {
  font-size: 24rpx;
  color: #e0e0e0;
  text-align: center;
}

.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16rpx;
  display: block;
}

/* 组队阶段 */
.team-building {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.player-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.player-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  min-width: 100rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.selected {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.2);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.player-select-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.player-select-name {
  font-size: 20rpx;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80rpx;
}

/* 投票阶段 */
.current-team {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
  justify-content: center;
}

.team-player {
  padding: 8rpx 16rpx;
  background: rgba(255, 215, 0, 0.2);
  border: 1rpx solid rgba(255, 215, 0, 0.4);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffd700;
}

.voting-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.vote-buttons {
  display: flex;
  gap: 20rpx;
}

/* 任务阶段 */
.quest-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.quest-buttons {
  display: flex;
  gap: 20rpx;
}

/* 刺杀阶段 */
.assassination-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 游戏结束 */
.game-over-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
  margin-bottom: 16rpx;
}

.game-over-reason {
  display: block;
  font-size: 24rpx;
  color: #e0e0e0;
  text-align: center;
  margin-bottom: 30rpx;
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

.skills-section, .tips-section, .seen-section {
  width: 100%;
  text-align: left;
}

.section-title {
  font-size: 20rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.skill-text, .tips-text, .seen-text {
  font-size: 16rpx;
  line-height: 1.4;
  display: block;
  margin-bottom: 8rpx;
}

.confirm-btn {
  width: 200rpx;
  margin-top: 20rpx;
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