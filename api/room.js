const USE_LOCAL_STORAGE = true

const API_BASE_URL = 'https://api.example.com/v1'

const request = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export const roomApi = {
  createRoom(data) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true, data })
    }
    return request({
      url: '/room/create',
      method: 'POST',
      data
    })
  },

  getRoom(roomId) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}`,
      method: 'GET'
    })
  },

  joinRoom(roomId, playerData) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}/join`,
      method: 'POST',
      data: playerData
    })
  },

  leaveRoom(roomId, playerId) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}/leave`,
      method: 'POST',
      data: { playerId }
    })
  },

  addScore(roomId, playerId, scoreData) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}/score`,
      method: 'POST',
      data: { playerId, ...scoreData }
    })
  },

  getRankList(roomId) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}/rank`,
      method: 'GET'
    })
  },

  updateRoom(roomId, data) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}`,
      method: 'PUT',
      data
    })
  },

  deleteRoom(roomId) {
    if (USE_LOCAL_STORAGE) {
      return Promise.resolve({ success: true })
    }
    return request({
      url: `/room/${roomId}`,
      method: 'DELETE'
    })
  }
}

export default roomApi
