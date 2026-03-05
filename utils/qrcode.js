import UQRCode from 'uqrcodejs'
import { getApiBaseUrl } from '../api/config'

export function generateQRCodeData(roomId, serverUrl, roomType) {
  const baseUrl = serverUrl || getApiBaseUrl()
  const data = {
    type: 'room_invite',
    roomId: roomId,
    serverUrl: baseUrl,
    roomType: roomType,
    timestamp: Date.now()
  }
  return JSON.stringify(data)
}

export function parseQRCodeData(data) {
  try {
    const parsed = JSON.parse(data)
    if (parsed.type === 'room_invite' && parsed.roomId && parsed.serverUrl) {
      return parsed
    }
    return null
  } catch (e) {
    return null
  }
}

export function generateQRCodeWithCanvas(canvasId, data, instance) {
  return new Promise((resolve, reject) => {
    try {
      // #ifdef MP-WEIXIN
      const qr = new UQRCode()
      qr.data = data
      qr.size = 200
      qr.margin = 10
      qr.make()
      
      const ctx = uni.createCanvasContext(canvasId, instance)
      const size = qr.moduleCount
      const tileSize = 200 / size
      
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(0, 0, 200, 200)
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (qr.modules[row][col]) {
            ctx.setFillStyle('#000000')
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
          }
        }
      }
      
      ctx.draw(false, () => {
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: canvasId,
            width: 200,
            height: 200,
            success: (res) => {
              resolve(res.tempFilePath)
            },
            fail: (err) => {
              reject(err)
            }
          }, instance)
        }, 200)
      })
      // #endif
      
      // #ifdef APP-PLUS
      const qr = new UQRCode()
      qr.data = data
      qr.size = 200
      qr.margin = 10
      qr.make()
      
      const ctx = uni.createCanvasContext(canvasId, instance)
      const size = qr.moduleCount
      const tileSize = 200 / size
      
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(0, 0, 200, 200)
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (qr.modules[row][col]) {
            ctx.setFillStyle('#000000')
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
          }
        }
      }
      
      ctx.draw(false, () => {
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: canvasId,
            width: 200,
            height: 200,
            success: (res) => {
              resolve(res.tempFilePath)
            },
            fail: (err) => {
              reject(err)
            }
          }, instance)
        }, 200)
      })
      // #endif
      
      // #ifdef H5
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      const qr = new UQRCode()
      qr.data = data
      qr.size = 200
      qr.margin = 10
      qr.make()
      
      const size = qr.moduleCount
      const tileSize = 200 / size
      
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 200, 200)
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (qr.modules[row][col]) {
            ctx.fillStyle = '#000000'
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
          }
        }
      }
      
      resolve(canvas.toDataURL())
      // #endif
    } catch (e) {
      console.error('generateQRCodeWithCanvas error:', e)
      reject(e)
    }
  })
}

export function getCanvasImagePath(canvasId, instance) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN || APP-PLUS
    uni.canvasToTempFilePath({
      canvasId: canvasId,
      width: 200,
      height: 200,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        reject(err)
      }
    }, instance)
    // #endif
    
    // #ifdef H5
    resolve('')
    // #endif
  })
}
