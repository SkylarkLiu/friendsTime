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
      const qr = new UQRCode()
      qr.data = data
      qr.size = 200
      qr.errorCorrectLevel = UQRCode.errorCorrectLevel.H
      qr.make()
      
      // #ifdef MP-WEIXIN
      const canvasContext = uni.createCanvasContext(canvasId, instance)
      qr.canvasContext = canvasContext
      qr.drawCanvas()
      
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId: canvasId,
          width: 200,
          height: 200,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            console.error('canvasToTempFilePath error:', err)
            reject(err)
          }
        }, instance)
      }, 500)
      // #endif
      
      // #ifdef APP-PLUS
      const canvasContext = uni.createCanvasContext(canvasId, instance)
      qr.canvasContext = canvasContext
      qr.drawCanvas()
      
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId: canvasId,
          width: 200,
          height: 200,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            console.error('canvasToTempFilePath error:', err)
            reject(err)
          }
        }, instance)
      }, 500)
      // #endif
      
      // #ifdef H5
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      qr.canvasContext = ctx
      qr.drawCanvas()
      
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
