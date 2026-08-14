import fetch from '@system.fetch'
import { getStorage, setStorage } from './storage.js'

export const STORAGE_KEY_BASE_URL = 'omniflow_api_base_url'
export const STORAGE_KEY_QUOTA_CACHE = 'omniflow_quota_cache'
export const STORAGE_KEY_LAST_SYNC_TIME = 'omniflow_last_sync_time'

export const DEFAULT_API_BASE_URL = 'https://om.nle.lol/api'

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
 * 统一回退读取本地持久化缓存
 * @param {string} errorMsg
 * @returns {Promise<{ success: boolean, keys: any[], isFromCache: boolean, updatedAt?: string, error?: string }>}
 */
async function getFallbackCache(errorMsg) {
  const cached = await getStorage(STORAGE_KEY_QUOTA_CACHE, null)
  if (cached && Array.isArray(cached.keys)) {
    return {
      success: true,
      keys: cached.keys,
      isFromCache: true,
      updatedAt: cached.updatedAt,
      error: `${errorMsg}，已展示本地缓存`
    }
  }
  return {
    success: false,
    keys: [],
    isFromCache: false,
    error: errorMsg
  }
}

/**
 * 发起网络请求获取真实算力配额列表（严格使用真实后端数据）
 * @returns {Promise<{ success: boolean, keys: any[], isFromCache: boolean, updatedAt?: string, error?: string }>}
 */
export async function queryWatchQuota() {
  const baseUrl = await getApiBaseUrl()
  const endpoint = getFullEndpoint(baseUrl, '/quota')

  return new Promise((resolve) => {
    fetch.fetch({
      url: endpoint,
      method: 'GET',
      responseType: 'json',
      timeout: 10000,
      success: async function (response) {
        let resData = response.data
        if (typeof resData === 'string') {
          try {
            resData = JSON.parse(resData)
          } catch (e) {}
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
        resolve(await getFallbackCache(`连接失败 (${code || 'offline'})`))
      }
    })
  })
}

/**
 * 触发全盘所有 Key 探针与配额重测刷新 (POST /quota/check-all)
 * @returns {Promise<{ success: boolean, keys: any[], isFromCache: boolean, updatedAt?: string, error?: string }>}
 */
export async function probeAllWatchQuota() {
  const baseUrl = await getApiBaseUrl()
  const endpoint = getFullEndpoint(baseUrl, '/quota/check-all')

  return new Promise((resolve) => {
    fetch.fetch({
      url: endpoint,
      method: 'POST',
      responseType: 'json',
      timeout: 15000,
      success: async function (response) {
        let resData = response.data
        if (typeof resData === 'string') {
          try {
            resData = JSON.parse(resData)
          } catch (e) {}
        }

        let keysList = []
        if (resData && Array.isArray(resData.data)) {
          keysList = resData.data
        } else if (Array.isArray(resData)) {
          keysList = resData
        }

        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

        // 缓存真实数据到本地存储
        const cacheObj = {
          keys: keysList,
          updatedAt: timeStr
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
        resolve(await getFallbackCache(`测算失败 (${code || 'offline'})`))
      }
    })
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
      timeout: 10000,
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
