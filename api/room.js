/**
 * 房间 API
 * 由 api/config.js 控制 USE_LOCAL_STORAGE，发布时走服务端
 */
import { USE_LOCAL_STORAGE, getApiBaseUrl, API_BASE_URL } from './config'

const request = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = res.data?.error || {}
          reject(new Error(err.message || res.data?.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export const roomApi = {
  /**
   * 创建房间（服务端会同时添加房主为第一玩家）
   * @param {Object} data - { roomName, hostName, winCondition }
   */
  createRoom(data) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true, data })
    }
    return request({
      url: '/v1/rooms',
      method: 'POST',
      data
    })
  },

  /**
   * 加入房间
   */
  joinRoom(roomId, playerData) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/v1/rooms/${roomId}/join`,
      method: 'POST',
      data: playerData
    })
  },

  /**
   * 获取房间快照（用于重连/兜底同步）
   */
  getRoom(roomId) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/v1/rooms/${roomId}`,
      method: 'GET'
    })
  },

  /**
   * 离开房间
   */
  leaveRoom(roomId, payload) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/v1/rooms/${roomId}/leave`,
      method: 'POST',
      data: payload
    })
  },

  /**
   * 房主更新房间（addPlayer/removePlayer/addScore/updateRoom）
   */
  updateRoomAction(roomId, payload) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/v1/rooms/${roomId}/update`,
      method: 'POST',
      data: payload
    })
  }
}

export { USE_LOCAL_STORAGE, API_BASE_URL }
export default roomApi
