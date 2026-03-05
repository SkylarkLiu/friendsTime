import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import networkManager from '@/api/network'
import roomApi, { USE_LOCAL_STORAGE } from '@/api/room'

const ROOMS_STORAGE_KEY = 'rooms_data'
const CURRENT_ROOM_KEY = 'current_room'

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref(null)
  const allRooms = ref(getStorage(ROOMS_STORAGE_KEY) || [])
  const networkStatus = ref('disconnected')
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
        totalScore: (player.scores || []).reduce((sum, s) => sum + (s.score || 0), 0)
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

  const applyRoomUpdate = (payload) => {
    if (!payload || !payload.data) return
    const data = payload.data
    if (!currentRoom.value || currentRoom.value.roomId !== data.roomId) return
    if (data.updateTime && currentRoom.value.updateTime && data.updateTime < currentRoom.value.updateTime) return
    currentRoom.value = { ...currentRoom.value, ...data }
    saveCurrentRoom()
  }

  const createRoom = async (roomName, winCondition = 'slaughter_side', options = {}) => {
    const { hostName, roomId: customRoomId } = options

    if (USE_LOCAL_STORAGE) {
      const roomIdToUse = customRoomId || generateRoomId()
      const newPlayerId = generatePlayerId()
      const newToken = generateToken()
      const newRoom = {
        roomId: roomIdToUse,
        name: roomName,
        players: hostName ? [{
          id: newPlayerId,
          name: hostName,
          avatar: '',
          scores: [],
          isAlive: true,
          deathType: null,
          deathRound: null,
          createTime: Date.now()
        }] : [],
        winCondition,
        createTime: Date.now(),
        updateTime: Date.now()
      }
      allRooms.value.push(newRoom)
      saveAllRooms()
      currentRoom.value = newRoom
      saveCurrentRoom()
      isHost.value = true
      playerId.value = newPlayerId
      token.value = newToken
      networkStatus.value = 'connected'
      return newRoom
    }

    if (!hostName) {
      throw new Error('服务端模式创建房间需传入 hostName')
    }
    try {
      const res = await roomApi.createRoom({ roomName, hostName, winCondition })
      if (!res.success || !res.data) throw new Error('创建房间失败')
      const { roomId, playerId: pid, token: tkn, wsUrl, room } = res.data
      currentRoom.value = room
      saveCurrentRoom()
      isHost.value = true
      playerId.value = pid
      token.value = tkn
      allRooms.value = allRooms.value.filter(r => r.roomId !== roomId)
      allRooms.value.unshift(room)
      saveAllRooms()

      networkStatus.value = 'connecting'
      const networkResult = await networkManager.init(true, roomId, pid, tkn, wsUrl)
      networkStatus.value = networkResult.success ? 'connected' : 'disconnected'
      if (!networkResult.success) console.warn('WebSocket 连接失败，房间已创建，将尝试重连')

      return room
    } catch (e) {
      console.error('创建房间失败:', e)
      throw e
    }
  }

  const getRoom = async (roomId) => {
    if (USE_LOCAL_STORAGE) {
      return allRooms.value.find(r => r.roomId === roomId) || null
    }
    try {
      const res = await roomApi.getRoom(roomId)
      if (res.success && res.data) return res.data
      return null
    } catch {
      return null
    }
  }

  const joinRoom = async (roomId, playerName) => {
    if (USE_LOCAL_STORAGE) {
      const room = await getRoom(roomId)
      if (!room) {
        return { success: false, message: '房间不存在或已过期' }
      }
      const existingPlayer = room.players.find(p => p.name === playerName)
      if (existingPlayer) {
        return { success: false, message: '该房间已存在同名玩家' }
      }
      const newPlayerId = generatePlayerId()
      const newToken = generateToken()
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
      isHost.value = false
      playerId.value = newPlayerId
      token.value = newToken
      networkStatus.value = 'connected'
      return { success: true, data: room }
    }

    try {
      const res = await roomApi.joinRoom(roomId, { playerName })
      if (!res.success || !res.data) {
        const err = res.error || {}
        return { success: false, message: err.message || '加入失败' }
      }
      const { roomId: rid, playerId: pid, token: tkn, wsUrl, room } = res.data
      currentRoom.value = room
      saveCurrentRoom()
      isHost.value = false
      playerId.value = pid
      token.value = tkn
      allRooms.value = allRooms.value.filter(r => r.roomId !== rid)
      allRooms.value.unshift(room)
      saveAllRooms()

      networkStatus.value = 'connecting'
      const networkResult = await networkManager.init(false, rid, pid, tkn, wsUrl)
      networkStatus.value = networkResult.success ? 'connected' : 'disconnected'

      return { success: true, data: room }
    } catch (e) {
      const msg = e.message || '加入失败'
      return { success: false, message: msg }
    }
  }

  const leaveRoom = async () => {
    if (!currentRoom.value) return
    const rid = currentRoom.value.roomId
    const pid = playerId.value
    const tkn = token.value

    networkManager.disconnect()
    networkStatus.value = 'disconnected'

    if (!USE_LOCAL_STORAGE && rid && pid && tkn) {
      try {
        await roomApi.leaveRoom(rid, { playerId: pid, token: tkn })
      } catch (_) {}
    } else if (USE_LOCAL_STORAGE) {
      const room = allRooms.value.find(r => r.roomId === rid)
      if (room) {
        room.updateTime = Date.now()
        saveAllRooms()
      }
    }

    currentRoom.value = null
    isHost.value = false
    playerId.value = null
    token.value = null
    removeStorage(CURRENT_ROOM_KEY)
    return { success: true }
  }

  const addScore = async (targetPlayerId, scoreData) => {
    if (!currentRoom.value) return { success: false, message: '未加入房间' }
    if (USE_LOCAL_STORAGE) {
      const player = currentRoom.value.players.find(p => p.id === targetPlayerId)
      if (!player) return { success: false, message: '玩家不存在' }
      player.scores = player.scores || []
      player.scores.push({ ...scoreData, time: Date.now() })
      currentRoom.value.updateTime = Date.now()
      saveAllRooms()
      saveCurrentRoom()
      if (isHost.value) networkManager.broadcast('room_updated', { roomId: currentRoom.value.roomId, updateTime: currentRoom.value.updateTime, data: currentRoom.value })
      return { success: true }
    }
    try {
      await roomApi.updateRoomAction(currentRoom.value.roomId, {
        token: token.value,
        playerId: playerId.value,
        action: 'addScore',
        payload: { targetPlayerId, scoreData }
      })
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message || '操作失败' }
    }
  }

  const getRankList = async () => {
    if (!currentRoom.value) return { success: false, message: '未加入房间' }
    return { success: true, data: rankList.value }
  }

  const addPlayer = async (playerName) => {
    if (!currentRoom.value) return { success: false, message: '未加入房间' }
    if (USE_LOCAL_STORAGE) {
      const existingPlayer = currentRoom.value.players.find(p => p.name === playerName)
      if (existingPlayer) return { success: false, message: '该房间已存在同名玩家' }
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
    try {
      const res = await roomApi.updateRoomAction(currentRoom.value.roomId, {
        token: token.value,
        playerId: playerId.value,
        action: 'addPlayer',
        payload: { playerName }
      })
      if (!res.success) return { success: false, message: res.error?.message || '添加失败' }
      const player = res.data?.players?.find(p => p.name === playerName)
      return { success: true, data: player }
    } catch (e) {
      return { success: false, message: e.message || '添加失败' }
    }
  }

  const removePlayer = async (targetPlayerId) => {
    if (!currentRoom.value) return { success: false, message: '未加入房间' }
    if (USE_LOCAL_STORAGE) {
      const index = currentRoom.value.players.findIndex(p => p.id === targetPlayerId)
      if (index === -1) return { success: false, message: '玩家不存在' }
      currentRoom.value.players.splice(index, 1)
      currentRoom.value.updateTime = Date.now()
      saveAllRooms()
      saveCurrentRoom()
      return { success: true }
    }
    try {
      await roomApi.updateRoomAction(currentRoom.value.roomId, {
        token: token.value,
        playerId: playerId.value,
        action: 'removePlayer',
        payload: { targetPlayerId }
      })
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message || '移除失败' }
    }
  }

  const updateRoom = async (data) => {
    if (!currentRoom.value) return { success: false, message: '未加入房间' }
    if (USE_LOCAL_STORAGE) {
      Object.assign(currentRoom.value, data)
      currentRoom.value.updateTime = Date.now()
      saveAllRooms()
      saveCurrentRoom()
      if (isHost.value) {
        networkManager.broadcast('room_updated', {
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
        })
      }
      return { success: true }
    }
    try {
      const { roomId: _r, createTime: _c, hostPlayerId: _h, ...payloadData } = data
      await roomApi.updateRoomAction(currentRoom.value.roomId, {
        token: token.value,
        playerId: playerId.value,
        action: 'updateRoom',
        payload: { data: payloadData }
      })
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message || '更新失败' }
    }
  }

  const deleteRoom = async (roomId) => {
    const index = allRooms.value.findIndex(r => r.roomId === roomId)
    if (index === -1) return { success: false, message: '房间不存在' }
    if (currentRoom.value?.roomId === roomId) {
      networkManager.disconnect()
      networkStatus.value = 'disconnected'
      isHost.value = false
      playerId.value = null
      token.value = null
      currentRoom.value = null
      removeStorage(CURRENT_ROOM_KEY)
    }
    allRooms.value.splice(index, 1)
    saveAllRooms()
    return { success: true }
  }

  const getAllRooms = () => {
    return [...allRooms.value].sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0))
  }

  const saveAllRooms = () => {
    setStorage(ROOMS_STORAGE_KEY, allRooms.value)
  }

  const saveCurrentRoom = () => {
    if (currentRoom.value) {
      setStorage(CURRENT_ROOM_KEY, {
        room: currentRoom.value,
        isHost: isHost.value,
        playerId: playerId.value,
        token: token.value
      })
    }
  }

  const loadCurrentRoom = async () => {
    const roomData = getStorage(CURRENT_ROOM_KEY)
    if (!roomData || !roomData.room) return null
    const room = roomData.room
    if (!USE_LOCAL_STORAGE) {
      try {
        const serverRoom = await getRoom(room.roomId)
        if (serverRoom) {
          roomData.room = serverRoom
        }
      } catch (_) {}
    }
    currentRoom.value = roomData.room
    isHost.value = roomData.isHost || false
    playerId.value = roomData.playerId || null
    token.value = roomData.token || null
    if (!USE_LOCAL_STORAGE && roomData.playerId && roomData.token) {
      networkStatus.value = 'connecting'
      networkManager.init(isHost.value, room.roomId, roomData.playerId, roomData.token)
        .then((res) => {
          networkStatus.value = res.success ? 'connected' : 'disconnected'
        })
    } else if (USE_LOCAL_STORAGE) {
      networkStatus.value = 'connected'
    }
    return currentRoom.value
  }

  const clearAllData = () => {
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

  const generateShareLink = () => {
    if (!currentRoom.value) return null
    return networkManager.generateShareLink()
  }

  const generateQRCode = () => {
    if (!currentRoom.value) return null
    return networkManager.generateQRCode()
  }

  const getNetworkStatus = () => networkStatus.value

  const registerNetworkEvent = (event, callback) => {
    networkManager.on(event, callback)
  }

  networkManager.on('room_updated', (payload) => {
    applyRoomUpdate(payload)
  })

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
