import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import networkManager from '@/api/network'

const ROOMS_STORAGE_KEY = 'rooms_data'
const CURRENT_ROOM_KEY = 'current_room'

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref(null)
  const allRooms = ref(getStorage(ROOMS_STORAGE_KEY) || [])
  const networkStatus = ref('disconnected') // disconnected, connecting, connected
  const isHost = ref(false)
  const playerId = ref(null)
  const token = ref(null)
  
  const isInRoom = computed(() => !!currentRoom.value)
  const currentRoomId = computed(() => currentRoom.value?.roomId || '')
  const currentPlayers = computed(() => currentRoom.value?.players || [])
  const playerCount = computed(() => currentPlayers.value.length)
  const connectionStatus = computed(() => networkStatus.value)
  
  const rankList = computed(() => {
    if (!currentRoom.value) return []
    return [...currentRoom.value.players]
      .map(player => ({
        ...player,
        totalScore: player.scores.reduce((sum, s) => sum + s.score, 0)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
  })
  
  const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  }

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  
  const createRoom = async (roomName, winCondition = 'slaughter_side', roomId = null) => {
    const roomIdToUse = roomId || generateRoomId()
    const newPlayerId = generatePlayerId()
    const newToken = generateToken()
    
    const newRoom = {
      roomId: roomIdToUse,
      name: roomName,
      players: [],
      winCondition: winCondition, // 'slaughter_side' | 'slaughter_all'
      createTime: Date.now(),
      updateTime: Date.now()
    }
    
    allRooms.value.push(newRoom)
    saveAllRooms()
    currentRoom.value = newRoom
    saveCurrentRoom()
    
    // 设置为房主
    isHost.value = true
    playerId.value = newPlayerId
    token.value = newToken
    
    // 初始化网络连接
    networkStatus.value = 'connecting'
    const networkResult = await networkManager.init(true, roomIdToUse, newPlayerId, newToken)
    
    if (networkResult.success) {
      networkStatus.value = 'connected'
      console.log('房间创建成功，网络连接已建立')
    } else {
      networkStatus.value = 'disconnected'
      console.error('网络连接失败:', networkResult.message)
    }
    
    return newRoom
  }
  
  const getRoom = async (roomId) => {
    const room = allRooms.value.find(r => r.roomId === roomId)
    if (!room) {
      return null
    }
    return room
  }
  
  const joinRoom = async (roomId, playerName) => {
    const newPlayerId = generatePlayerId()
    const newToken = generateToken()
    
    // 初始化网络连接
    networkStatus.value = 'connecting'
    const networkResult = await networkManager.init(false, roomId, newPlayerId, newToken)
    
    if (!networkResult.success) {
      networkStatus.value = 'disconnected'
      return {
        success: false,
        message: '网络连接失败: ' + networkResult.message
      }
    }
    
    // 尝试加入房间
    const room = await getRoom(roomId)
    
    if (!room) {
      networkManager.disconnect()
      networkStatus.value = 'disconnected'
      return {
        success: false,
        message: '房间不存在或已过期'
      }
    }
    
    const existingPlayer = room.players.find(p => p.name === playerName)
    if (existingPlayer) {
      networkManager.disconnect()
      networkStatus.value = 'disconnected'
      return {
        success: false,
        message: '该房间已存在同名玩家'
      }
    }
    
    const newPlayer = {
      id: newPlayerId,
      name: playerName,
      avatar: '',
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: Date.now()
    }
    
    room.players.push(newPlayer)
    room.updateTime = Date.now()
    
    saveAllRooms()
    currentRoom.value = room
    saveCurrentRoom()
    
    // 设置玩家信息
    isHost.value = false
    playerId.value = newPlayerId
    token.value = newToken
    networkStatus.value = 'connected'
    
    console.log('加入房间成功，网络连接已建立')
    
    return {
      success: true,
      data: room
    }
  }
  
  const leaveRoom = async () => {
    if (!currentRoom.value) return
    
    // 断开网络连接
    networkManager.disconnect()
    networkStatus.value = 'disconnected'
    
    const roomId = currentRoom.value.roomId
    const room = allRooms.value.find(r => r.roomId === roomId)
    
    if (room) {
      room.updateTime = Date.now()
      saveAllRooms()
    }
    
    currentRoom.value = null
    isHost.value = false
    playerId.value = null
    token.value = null
    removeStorage(CURRENT_ROOM_KEY)
    
    return { success: true }
  }
  
  const addScore = async (playerId, scoreData) => {
    if (!currentRoom.value) {
      return { success: false, message: '未加入房间' }
    }
    
    const player = currentRoom.value.players.find(p => p.id === playerId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }
    
    player.scores.push({
      ...scoreData,
      time: Date.now()
    })
    
    currentRoom.value.updateTime = Date.now()
    saveAllRooms()
    saveCurrentRoom()
    
    return { success: true }
  }
  
  const getRankList = async () => {
    if (!currentRoom.value) {
      return { success: false, message: '未加入房间' }
    }
    
    return {
      success: true,
      data: rankList.value
    }
  }
  
  const addPlayer = async (playerName) => {
    if (!currentRoom.value) {
      return { success: false, message: '未加入房间' }
    }
    
    const existingPlayer = currentRoom.value.players.find(p => p.name === playerName)
    if (existingPlayer) {
      return { success: false, message: '该房间已存在同名玩家' }
    }
    
    const newPlayer = {
      id: `player_${Date.now()}`,
      name: playerName,
      avatar: '',
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: Date.now()
    }
    
    currentRoom.value.players.push(newPlayer)
    currentRoom.value.updateTime = Date.now()
    
    saveAllRooms()
    saveCurrentRoom()
    
    return { success: true, data: newPlayer }
  }
  
  const removePlayer = async (playerId) => {
    if (!currentRoom.value) {
      return { success: false, message: '未加入房间' }
    }
    
    const index = currentRoom.value.players.findIndex(p => p.id === playerId)
    if (index === -1) {
      return { success: false, message: '玩家不存在' }
    }
    
    currentRoom.value.players.splice(index, 1)
    currentRoom.value.updateTime = Date.now()
    
    saveAllRooms()
    saveCurrentRoom()
    
    return { success: true }
  }
  
  const updateRoom = async (data) => {
    if (!currentRoom.value) {
      return { success: false, message: '未加入房间' }
    }
    
    Object.assign(currentRoom.value, data)
    currentRoom.value.updateTime = Date.now()
    
    saveAllRooms()
    saveCurrentRoom()
    
    // 如果是房主，广播房间更新消息
    if (isHost.value) {
      // 构建包含角色信息的广播数据
      const broadcastData = {
        roomId: currentRoom.value.roomId,
        updateTime: currentRoom.value.updateTime,
        data: {
          roomId: currentRoom.value.roomId,
          name: currentRoom.value.name,
          players: currentRoom.value.players,
          winCondition: currentRoom.value.winCondition,
          roles: currentRoom.value.roles,
          preset: currentRoom.value.preset,
          createTime: currentRoom.value.createTime,
          updateTime: currentRoom.value.updateTime
        }
      }
      
      networkManager.broadcast('room_updated', broadcastData)
    }
    
    return { success: true }
  }
  
  const deleteRoom = async (roomId) => {
    const index = allRooms.value.findIndex(r => r.roomId === roomId)
    if (index === -1) {
      return { success: false, message: '房间不存在' }
    }
    
    // 如果是当前房间，断开网络连接
    if (currentRoom.value?.roomId === roomId) {
      networkManager.disconnect()
      networkStatus.value = 'disconnected'
      isHost.value = false
      playerId.value = null
      token.value = null
      currentRoom.value = null
      removeStorage(CURRENT_ROOM_KEY)
    }
    
    // 如果是房主，广播房间删除消息
    if (isHost.value) {
      networkManager.broadcast('room_deleted', {
        roomId: roomId
      })
    }
    
    allRooms.value.splice(index, 1)
    saveAllRooms()
    
    return { success: true }
  }
  
  const getAllRooms = () => {
    return allRooms.value.sort((a, b) => b.updateTime - a.updateTime)
  }
  
  const saveAllRooms = () => {
    setStorage(ROOMS_STORAGE_KEY, allRooms.value)
  }
  
  const saveCurrentRoom = () => {
    if (currentRoom.value) {
      const roomData = {
        room: currentRoom.value,
        isHost: isHost.value,
        playerId: playerId.value,
        token: token.value
      }
      setStorage(CURRENT_ROOM_KEY, roomData)
    }
  }
  
  const loadCurrentRoom = () => {
    const roomData = getStorage(CURRENT_ROOM_KEY)
    if (roomData && roomData.room) {
      currentRoom.value = roomData.room
      isHost.value = roomData.isHost || false
      playerId.value = roomData.playerId || null
      token.value = roomData.token || null
    }
    return currentRoom.value
  }
  
  const clearAllData = () => {
    // 断开网络连接
    networkManager.disconnect()
    
    currentRoom.value = null
    allRooms.value = []
    networkStatus.value = 'disconnected'
    isHost.value = false
    playerId.value = null
    token.value = null
    
    removeStorage(ROOMS_STORAGE_KEY)
    removeStorage(CURRENT_ROOM_KEY)
  }

  // 生成分享链接
  const generateShareLink = () => {
    if (!currentRoom.value) {
      return null
    }
    return networkManager.generateShareLink()
  }

  // 生成二维码
  const generateQRCode = () => {
    if (!currentRoom.value) {
      return null
    }
    return networkManager.generateQRCode()
  }

  // 获取网络状态
  const getNetworkStatus = () => {
    return networkStatus.value
  }

  // 注册网络事件回调
  const registerNetworkEvent = (event, callback) => {
    networkManager.on(event, callback)
  }
  
  return {
    currentRoom,
    allRooms,
    isInRoom,
    currentRoomId,
    currentPlayers,
    playerCount,
    rankList,
    networkStatus,
    connectionStatus,
    isHost,
    playerId,
    token,
    createRoom,
    getRoom,
    joinRoom,
    leaveRoom,
    addScore,
    getRankList,
    addPlayer,
    removePlayer,
    updateRoom,
    deleteRoom,
    getAllRooms,
    loadCurrentRoom,
    clearAllData,
    generateShareLink,
    generateQRCode,
    getNetworkStatus,
    registerNetworkEvent
  }
})
