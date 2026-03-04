/**
 * 网络通信模块 - 真实 WebSocket + 指数退避重连
 */
import { getApiBaseUrl } from './config'

class NetworkManager {
  constructor() {
    this.socketTask = null
    this.isHost = false
    this.playerId = null
    this.token = null
    this.roomId = null
    this.wsUrl = null
    this.callbacks = {}
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelays = [3000, 5000, 8000, 10000, 15000, 20000, 25000, 30000, 35000, 40000]
    this.reconnectTimer = null
    this.pingTimer = null
    this._connecting = false
  }

  getWsUrl() {
    if (this.wsUrl) return this.wsUrl
    const base = getApiBaseUrl().replace(/^http/i, 'ws').replace(/\/$/, '')
    return `${base}/v1/ws`
  }

  buildWsUrl() {
    const url = new URL(this.getWsUrl())
    url.searchParams.set('roomId', this.roomId)
    url.searchParams.set('playerId', this.playerId)
    url.searchParams.set('token', this.token)
    return url.toString()
  }

  async init(isHost, roomId, playerId, token, wsUrl = null) {
    this.isHost = isHost
    this.roomId = roomId
    this.playerId = playerId
    this.token = token
    if (wsUrl) this.wsUrl = wsUrl
    this.reconnectAttempts = 0

    return this._connect()
  }

  _connect() {
    if (this._connecting) {
      return Promise.resolve({ success: false, message: '正在连接中' })
    }
    this._connecting = true

    return new Promise((resolve) => {
      const url = this.buildWsUrl()
      try {
        this.socketTask = uni.connectSocket({
          url,
          fail: (err) => {
            this._connecting = false
            console.error('WebSocket 连接失败:', err)
            this._scheduleReconnect()
            resolve({ success: false, message: err.errMsg || '连接失败' })
          }
        })

        this.socketTask.onOpen(() => {
          this._connecting = false
          this.reconnectAttempts = 0
          this._startPing()
          resolve({ success: true })
        })

        this.socketTask.onMessage((res) => {
          this._handleMessage(res.data)
        })

        this.socketTask.onClose((res) => {
          this._stopPing()
          if (!res || res.code !== 1000) {
            this._scheduleReconnect()
          }
          if (this.callbacks['disconnect']) {
            this.callbacks['disconnect'](res)
          }
        })

        this.socketTask.onError((err) => {
          this._connecting = false
          console.error('WebSocket 错误:', err)
          if (this.callbacks['error']) {
            this.callbacks['error'](err)
          }
        })
      } catch (e) {
        this._connecting = false
        resolve({ success: false, message: e.message || '连接异常' })
      }
    })
  }

  _handleMessage(raw) {
    try {
      const msg = JSON.parse(raw)
      const { type, payload } = msg

      if (type === 'pong') {
        return
      }
      if (type === 'error') {
        console.error('服务端错误:', payload)
        if (this.callbacks['error']) {
          this.callbacks['error'](payload)
        }
        return
      }
      if (this.callbacks[type]) {
        this.callbacks[type](payload)
      }
    } catch (e) {
      console.error('解析消息失败:', raw, e)
    }
  }

  _startPing() {
    this._stopPing()
    this.pingTimer = setInterval(() => {
      this.send('ping', {})
    }, 25000)
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('重连次数已用尽')
      if (this.callbacks['reconnect_failed']) {
        this.callbacks['reconnect_failed']()
      }
      return
    }
    const delay = this.reconnectDelays[this.reconnectAttempts] || 40000
    this.reconnectAttempts++
    console.log(`将在 ${delay / 1000}s 后重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this._connect().then((res) => {
        if (res.success && this.callbacks['reconnected']) {
          this.callbacks['reconnected']()
        }
      })
    }, delay)
  }

  send(type, payload) {
    if (!this.socketTask) return false
    try {
      const msg = JSON.stringify({ type, payload })
      this.socketTask.send({ data: msg })
      return true
    } catch (e) {
      console.error('发送失败:', e)
      return false
    }
  }

  broadcast(type, payload) {
    // 客户端不直接广播，由服务端在 HTTP 更新后广播
    // 保留接口兼容，但实际广播由服务端完成
    return true
  }

  sendToPlayer(playerId, type, payload) {
    return this.send('send_to_player', { playerId, type, payload })
  }

  on(event, callback) {
    this.callbacks[event] = callback
  }

  disconnect() {
    this._stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.socketTask) {
      try {
        this.socketTask.close({ code: 1000 })
      } catch (_) {}
      this.socketTask = null
    }
  }

  generateShareLink() {
    if (!this.roomId) return ''
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/pages/rank/room` : ''
    return `${baseUrl}?roomId=${encodeURIComponent(this.roomId)}`
  }

  generateQRCode() {
    return this.generateShareLink()
  }
}

export default new NetworkManager()
