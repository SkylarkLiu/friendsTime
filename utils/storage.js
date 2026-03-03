const STORAGE_PREFIX = 'huanjuju_'

export const getStorage = (key) => {
  try {
    const fullKey = STORAGE_PREFIX + key
    const data = uni.getStorageSync(fullKey)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch (e) {
    console.error('getStorage error:', e)
    return null
  }
}

export const setStorage = (key, value) => {
  try {
    const fullKey = STORAGE_PREFIX + key
    uni.setStorageSync(fullKey, JSON.stringify(value))
    return true
  } catch (e) {
    console.error('setStorage error:', e)
    return false
  }
}

export const removeStorage = (key) => {
  try {
    const fullKey = STORAGE_PREFIX + key
    uni.removeStorageSync(fullKey)
    return true
  } catch (e) {
    console.error('removeStorage error:', e)
    return false
  }
}

export const clearAllStorage = () => {
  try {
    const res = uni.getStorageInfoSync()
    res.keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        uni.removeStorageSync(key)
      }
    })
    return true
  } catch (e) {
    console.error('clearAllStorage error:', e)
    return false
  }
}

export const getStorageInfo = () => {
  try {
    return uni.getStorageInfoSync()
  } catch (e) {
    console.error('getStorageInfo error:', e)
    return null
  }
}
