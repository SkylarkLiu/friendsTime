/**
 * 好友派对助手 - 房间同步服务
 * MVP: 内存存储，HTTP + WebSocket 实时同步
 */
import Fastify from 'fastify'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'
const ROOM_TTL_MS = 60 * 60 * 1000 // 60 分钟无人活动清理

// ========== 内存存储 ==========
const rooms = new Map() // roomId -> Room
const sessions = new Map() // token -> Session
const wsClients = new Map() // token -> WebSocket

function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function generateToken() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`
}

function cleanExpiredRooms() {
  const now = Date.now()
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.updateTime > ROOM_TTL_MS) {
      rooms.delete(roomId)
      for (const [token, session] of sessions.entries()) {
        if (session.roomId === roomId) sessions.delete(token)
      }
    }
  }
}
setInterval(cleanExpiredRooms, 5 * 60 * 1000)

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000'
  const wsProto = proto === 'https' ? 'wss' : 'ws'
  return { http: `${proto}://${host}`, ws: `${wsProto}://${host}` }
}

function getRoomPayload(room) {
  const base = {
    roomId: room.roomId,
    name: room.name,
    players: room.players,
    winCondition: room.winCondition,
    roles: room.roles || [],
    preset: room.preset || null,
    createTime: room.createTime,
    updateTime: room.updateTime
  }
  if (room.avalonData !== undefined) base.avalonData = room.avalonData
  if (room.dealtCards !== undefined) base.dealtCards = room.dealtCards
  if (room.gameState !== undefined) base.gameState = room.gameState
  return base
}

function broadcastRoomUpdate(roomId, room) {
  const message = JSON.stringify({
    type: 'room_updated',
    payload: {
      roomId,
      updateTime: room.updateTime,
      data: getRoomPayload(room)
    }
  })
  for (const [token, session] of sessions.entries()) {
    if (session.roomId === roomId) {
      const ws = wsClients.get(token)
      if (ws && ws.readyState === 1) ws.send(message)
    }
  }
}

function verifyToken(roomId, playerId, token) {
  const session = sessions.get(token)
  if (!session || session.roomId !== roomId || session.playerId !== playerId) return false
  session.lastSeen = Date.now()
  return true
}

// ========== Fastify ==========
const fastify = Fastify({ logger: true })

// CORS
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*')
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  reply.header('Access-Control-Allow-Headers', 'Content-Type')
  if (request.method === 'OPTIONS') {
    return reply.send()
  }
})

// POST /v1/rooms - 创建房间
fastify.post('/v1/rooms', async (request, reply) => {
  const { roomName, hostName, winCondition = 'slaughter_side' } = request.body || {}
  if (!roomName || !hostName) {
    return reply.status(400).send({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'roomName 和 hostName 必填' }
    })
  }
  const roomId = generateRoomId()
  const playerId = generatePlayerId()
  const token = generateToken()
  const now = Date.now()

  const room = {
    roomId,
    name: roomName,
    winCondition,
    players: [{
      id: playerId,
      name: hostName,
      avatar: '',
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: now
    }],
    roles: [],
    preset: null,
    createTime: now,
    updateTime: now,
    hostPlayerId: playerId
  }
  rooms.set(roomId, room)
  sessions.set(token, { token, roomId, playerId, lastSeen: now })

  const { ws } = getBaseUrl(request)
  return {
    success: true,
    data: {
      roomId,
      playerId,
      token,
      wsUrl: `${ws}/v1/ws`,
      room
    }
  }
})

// POST /v1/rooms/:roomId/join - 加入房间
fastify.post('/v1/rooms/:roomId/join', async (request, reply) => {
  const { roomId } = request.params
  const { playerName } = request.body || {}
  if (!playerName || !playerName.trim()) {
    return reply.status(400).send({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'playerName 必填' }
    })
  }
  const room = rooms.get(roomId)
  if (!room) {
    return reply.status(404).send({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: '房间不存在或已过期' }
    })
  }
  const existing = room.players.find(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase())
  if (existing) {
    return reply.status(400).send({
      success: false,
      error: { code: 'DUPLICATE_NAME', message: '该房间已存在同名玩家' }
    })
  }
  const playerId = generatePlayerId()
  const token = generateToken()
  const now = Date.now()
  room.players.push({
    id: playerId,
    name: playerName.trim(),
    avatar: '',
    scores: [],
    isAlive: true,
    deathType: null,
    deathRound: null,
    createTime: now
  })
  room.updateTime = now
  sessions.set(token, { token, roomId, playerId, lastSeen: now })

  broadcastRoomUpdate(roomId, room)
  const { ws } = getBaseUrl(request)
  return {
    success: true,
    data: {
      roomId,
      playerId,
      token,
      wsUrl: `${ws}/v1/ws`,
      room
    }
  }
})

// GET /v1/rooms/:roomId - 获取房间快照
fastify.get('/v1/rooms/:roomId', async (request, reply) => {
  const { roomId } = request.params
  const room = rooms.get(roomId)
  if (!room) {
    return reply.status(404).send({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: '房间不存在或已过期' }
    })
  }
  return {
    success: true,
    data: room
  }
})

// POST /v1/rooms/:roomId/leave - 离开房间
fastify.post('/v1/rooms/:roomId/leave', async (request, reply) => {
  const { roomId } = request.params
  const { playerId, token } = request.body || {}
  if (!verifyToken(roomId, playerId, token)) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'token 无效' }
    })
  }
  const room = rooms.get(roomId)
  if (!room) {
    return reply.status(404).send({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: '房间不存在' }
    })
  }
  const idx = room.players.findIndex(p => p.id === playerId)
  if (idx >= 0) room.players.splice(idx, 1)
  room.updateTime = Date.now()
  sessions.delete(token)
  wsClients.delete(token)
  broadcastRoomUpdate(roomId, room)
  return { success: true }
})

// POST /v1/rooms/:roomId/update - 更新房间（房主操作：addPlayer/removePlayer/addScore/updateRoom）
fastify.post('/v1/rooms/:roomId/update', async (request, reply) => {
  const { roomId } = request.params
  const { token, playerId, action, payload } = request.body || {}
  const room = rooms.get(roomId)
  if (!room) {
    return reply.status(404).send({
      success: false,
      error: { code: 'ROOM_NOT_FOUND', message: '房间不存在' }
    })
  }
  if (!verifyToken(roomId, playerId, token)) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'token 无效' }
    })
  }
  if (room.hostPlayerId !== playerId) {
    return reply.status(403).send({
      success: false,
      error: { code: 'NOT_HOST', message: '只有房主可更新房间' }
    })
  }
  const now = Date.now()
  room.updateTime = now

  if (action === 'addPlayer') {
    const { playerName } = payload || {}
    if (!playerName || !playerName.trim()) {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'playerName 必填' } })
    }
    if (room.players.some(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase())) {
      return reply.status(400).send({ success: false, error: { code: 'DUPLICATE_NAME', message: '同名玩家已存在' } })
    }
    const newId = generatePlayerId()
    room.players.push({
      id: newId,
      name: playerName.trim(),
      avatar: '',
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: now
    })
  } else if (action === 'removePlayer') {
    const { targetPlayerId } = payload || {}
    const idx = room.players.findIndex(p => p.id === targetPlayerId)
    if (idx >= 0) room.players.splice(idx, 1)
  } else if (action === 'addScore') {
    const { targetPlayerId, scoreData } = payload || {}
    const player = room.players.find(p => p.id === targetPlayerId)
    if (player) {
      player.scores.push({ ...scoreData, time: now })
    }
  } else if (action === 'updateRoom') {
    const { data } = payload || {}
    const exclude = ['roomId', 'createTime', 'hostPlayerId']
    if (data) {
      for (const k of Object.keys(data)) {
        if (!exclude.includes(k)) room[k] = data[k]
      }
      room.updateTime = now
    }
  } else {
    return reply.status(400).send({ success: false, error: { code: 'INVALID_ACTION', message: '未知 action' } })
  }

  broadcastRoomUpdate(roomId, room)
  return { success: true, data: room }
})

// 启动
try {
  await fastify.listen({ port: PORT, host: HOST })
  const wss = new WebSocketServer({ noServer: true })
  fastify.server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`)
    if (url.pathname !== '/v1/ws') {
      socket.destroy()
      return
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      const roomId = url.searchParams.get('roomId')
      const playerId = url.searchParams.get('playerId')
      const token = url.searchParams.get('token')
      if (!roomId || !playerId || !token) {
        ws.send(JSON.stringify({ type: 'error', payload: { code: 'INVALID_PARAMS', message: '缺少 roomId/playerId/token' } }))
        ws.close()
        return
      }
      if (!verifyToken(roomId, playerId, token)) {
        ws.send(JSON.stringify({ type: 'error', payload: { code: 'UNAUTHORIZED', message: 'token 无效或已过期' } }))
        ws.close()
        return
      }
      const room = rooms.get(roomId)
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', payload: { code: 'ROOM_NOT_FOUND', message: '房间不存在或已过期' } }))
        ws.close()
        return
      }
      wsClients.set(token, ws)
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString())
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
          }
        } catch (_) {}
      })
      ws.on('close', () => wsClients.delete(token))
      ws.on('error', () => wsClients.delete(token))
      ws.send(JSON.stringify({
        type: 'room_updated',
        payload: { roomId, updateTime: room.updateTime, data: getRoomPayload(room) }
      }))
    })
  })
  console.log(`服务已启动: http://${HOST}:${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
