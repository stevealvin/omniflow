import fetch from '@system.fetch'
import { getStorage, setStorage } from './storage.js'

export const STORAGE_KEY_BASE_URL = 'omniflow_api_base_url'
export const STORAGE_KEY_QUOTA_CACHE = 'omniflow_quota_cache'
export const STORAGE_KEY_LAST_SYNC_TIME = 'omniflow_last_sync_time'

export const DEFAULT_API_BASE_URL = 'https://nl-omniflow.vercel.app/api'

/**
 * 格式化拼接完整的 API 路由地址（自适应处理 /api 前缀）
 * @param {string} baseUrl
 * @param {string} path 如 '/quota' 或 '/watch/sync'
 * @returns {string}
 */
export function getFullEndpoint(baseUrl, path) {
  const cleanBase = (baseUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (cleanBase.endsWith('/api')) {
    return `${cleanBase}${cleanPath}`
  }
  return `${cleanBase}/api${cleanPath}`
}

/**
 * 获取当前配置的后端 API 地址
 * @returns {Promise<string>}
 */
export async function getApiBaseUrl() {
  const customUrl = await getStorage(STORAGE_KEY_BASE_URL, '')
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '')
  }
  return DEFAULT_API_BASE_URL
}

/**
 * 设置后端 API 地址
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function setApiBaseUrl(url) {
  const cleanUrl = (url || '').trim().replace(/\/+$/, '')
  return await setStorage(STORAGE_KEY_BASE_URL, cleanUrl)
}

/**
 * 发起网络请求获取真实算力配额列表（严格使用真实后端数据，无任何模拟数据）
 * @returns {Promise<{ success: boolean, keys: any[], isFromCache: boolean, updatedAt?: string, error?: string }>}
 */
export async function queryWatchQuota() {
  const baseUrl = await getApiBaseUrl()
  const endpoint = getFullEndpoint(baseUrl, '/quota')

  return new Promise((resolve) => {
    let hasResolved = false

    // 12 秒超时保护（适应穿戴设备网络延迟与云端冷启动），超时后回退真实本地缓存
    const timeoutTimer = setTimeout(async () => {
      if (!hasResolved) {
        hasResolved = true
        const cached = await getStorage(STORAGE_KEY_QUOTA_CACHE, null)
        if (cached && Array.isArray(cached.keys)) {
          resolve({
            success: true,
            keys: cached.keys,
            isFromCache: true,
            updatedAt: cached.updatedAt,
            error: '请求超时，已展示离线缓存'
          })
        } else {
          resolve({
            success: true,
            keys: [],
            isFromCache: false,
            error: '请求超时，未能连接到后端'
          })
        }
      }
    }, 5000)

    try {
      fetch.fetch({
        url: endpoint,
        method: 'GET',
        responseType: 'json',
        success: async function (response) {
          if (hasResolved) return
          hasResolved = true
          clearTimeout(timeoutTimer)

          let resData = response.data
          if (typeof resData === 'string') {
            try {
              resData = JSON.parse(resData)
            } catch (e) {
              // 保持原数据
            }
          }

          let keysList = []
          if (resData && Array.isArray(resData.data)) {
            keysList = resData.data
          } else if (Array.isArray(resData)) {
            keysList = resData
          } else if (resData && Array.isArray(resData.keys)) {
            keysList = resData.keys
          }

          const now = new Date()
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

          // 缓存真实数据到本地存储
          const cacheObj = {
            keys: keysList,
            updatedAt: resData?.updatedAt || timeStr
          }
          await setStorage(STORAGE_KEY_QUOTA_CACHE, cacheObj)
          await setStorage(STORAGE_KEY_LAST_SYNC_TIME, timeStr)

          resolve({
            success: true,
            keys: keysList,
            isFromCache: false,
            updatedAt: timeStr
          })
        },
        fail: async function (errData, code) {
          if (hasResolved) return
          hasResolved = true
          clearTimeout(timeoutTimer)

          const cached = await getStorage(STORAGE_KEY_QUOTA_CACHE, null)
          if (cached && Array.isArray(cached.keys)) {
            resolve({
              success: true,
              keys: cached.keys,
              isFromCache: true,
              updatedAt: cached.updatedAt,
              error: `连接失败 (${code || 'offline'})，已展示离线缓存`
            })
          } else {
            resolve({
              success: false,
              keys: [],
              isFromCache: false,
              error: `连接失败 (${code || 'offline'})`
            })
          }
        }
      })
    } catch (e) {
      if (hasResolved) return
      hasResolved = true
      clearTimeout(timeoutTimer)

      getStorage(STORAGE_KEY_QUOTA_CACHE, null).then((cached) => {
        if (cached && Array.isArray(cached.keys)) {
          resolve({
            success: true,
            keys: cached.keys,
            isFromCache: true,
            updatedAt: cached.updatedAt,
            error: '网络请求异常，已展示离线缓存'
          })
        } else {
          resolve({
            success: false,
            keys: [],
            isFromCache: false,
            error: '网络请求异常'
          })
        }
      })
    }
  })
}

/**
 * 触发单个 Key 探针测试刷新
 * @param {string} id
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export async function checkSingleKey(id) {
  const baseUrl = await getApiBaseUrl()
  const endpoint = getFullEndpoint(baseUrl, `/quota/${id}/check`)

  return new Promise((resolve) => {
    fetch.fetch({
      url: endpoint,
      method: 'POST',
      responseType: 'json',
      success: function (res) {
        let resData = res.data
        if (typeof resData === 'string') {
          try {
            resData = JSON.parse(resData)
          } catch (e) {}
        }
        resolve({ success: true, data: resData?.data })
      },
      fail: function (errData, code) {
        resolve({ success: false, error: `检测失败 (${code})` })
      }
    })
  })
}
