/**
 * 网络配置
 * 开发时可在 .env.development 设置 VITE_USE_LOCAL_STORAGE=true 使用本地模拟
 * 打包发布时 VITE_USE_LOCAL_STORAGE 默认 false 走服务端，VITE_API_BASE_URL 为实际后端地址
 */
const API_BASE_URL_STORAGE_KEY = 'api_base_url'

export const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true'

function normalizeBaseUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

export function getApiBaseUrl() {
  const stored = normalizeBaseUrl(uni.getStorageSync(API_BASE_URL_STORAGE_KEY))
  if (stored) return stored
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  if (envUrl) return envUrl
  return ''
}

export function setApiBaseUrl(url) {
  const normalized = normalizeBaseUrl(url)
  if (!normalized) {
    throw new Error('服务器地址必须以 http:// 或 https:// 开头')
  }
  uni.setStorageSync(API_BASE_URL_STORAGE_KEY, normalized)
  return normalized
}

export function clearApiBaseUrl() {
  uni.removeStorageSync(API_BASE_URL_STORAGE_KEY)
}

// 为兼容旧代码导出（注意：该值不会随运行时配置变化）
export const API_BASE_URL = getApiBaseUrl()
