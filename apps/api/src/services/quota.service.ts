import { supabase } from '../utils/supabase.js'
import type { ApiKeyConfig } from '../types/index.js'
import { QuotaProviderFactory } from './providers/factory.js'

/**
 * 转换数据库行记录为 ApiKeyConfig 结构
 */
const toConfig = (r: any): ApiKeyConfig => ({
  id: r.id,
  name: r.name,
  type: r.type,
  provider: r.provider,
  baseUrl: r.base_url,
  apiKey: r.api_key,
  refreshToken: r.refresh_token,
  accessToken: r.access_token,
  email: r.email,
  status: r.status,
  lastTestedAt: r.last_tested_at,
  tokenQuota: r.token_quota,
  quotaInfo: r.quota_info,
  rawQuotaData: r.raw_quota_data
})

/**
 * 转换 ApiKeyConfig 结构为数据库字段格式
 */
const toDb = (c: Partial<ApiKeyConfig>) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  provider: c.provider,
  base_url: c.baseUrl,
  api_key: c.apiKey,
  refresh_token: c.refreshToken,
  access_token: c.accessToken,
  email: c.email,
  status: c.status,
  last_tested_at: c.lastTestedAt,
  token_quota: c.tokenQuota,
  quota_info: c.quotaInfo,
  raw_quota_data: c.rawQuotaData
})

let inMemoryStore: ApiKeyConfig[] = []

/**
 * 获取所有算力配额与 API 密钥配置列表
 */
export const listQuotaConfigs = async (): Promise<ApiKeyConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('api_key_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return inMemoryStore
    }

    return data.map(toConfig)
  } catch (err: any) {
    console.warn('[Supabase 读取提示]', err.message)
    return inMemoryStore
  }
}

/**
 * 添加算力配额或 API 资源配置
 */
export const addQuotaConfig = async (payload: Omit<ApiKeyConfig, 'id' | 'status'>): Promise<ApiKeyConfig> => {
  const isTokenPlane = payload.type === 'token-plane' || payload.provider === 'google-antigravity' || payload.provider === 'openai-codex'

  const tempKey: ApiKeyConfig = {
    ...payload,
    type: isTokenPlane ? 'token-plane' : 'api-key',
    id: `${isTokenPlane ? 'token' : 'key'}-${Date.now()}`,
    status: 'untested'
  }

  const provider = QuotaProviderFactory.getProvider(payload.provider)
  const fetchResult = await provider.fetchQuota(tempKey)

  const newKey: ApiKeyConfig = {
    ...tempKey,
    status: fetchResult.status,
    lastTestedAt: fetchResult.lastTestedAt,
    tokenQuota: fetchResult.tokenQuota,
    quotaInfo: fetchResult.quotaInfo,
    rawQuotaData: fetchResult.rawQuotaData
  }

  try {
    const dbPayload = toDb(newKey)
    const { data, error } = await supabase
      .from('api_key_configs')
      .insert([dbPayload])
      .select('*')

    if (error || !data || data.length === 0) {
      inMemoryStore.unshift(newKey)
      return newKey
    }

    return toConfig(data[0])
  } catch (err: any) {
    console.error('[Supabase 写入异常]:', err.message)
    inMemoryStore.unshift(newKey)
    return newKey
  }
}

/**
 * 更新算力配额或 API 资源配置
 */
export const updateQuotaConfig = async (id: string, payload: Partial<ApiKeyConfig>): Promise<ApiKeyConfig | null> => {
  try {
    const dbPayload = toDb(payload)
    const { data, error } = await supabase
      .from('api_key_configs')
      .update(dbPayload)
      .eq('id', id)
      .select('*')

    if (error || !data || data.length === 0) {
      const idx = inMemoryStore.findIndex((k) => k.id === id)
      if (idx !== -1) {
        inMemoryStore[idx] = { ...inMemoryStore[idx], ...payload }
        return inMemoryStore[idx]
      }
      return null
    }

    return toConfig(data[0])
  } catch (err: any) {
    const idx = inMemoryStore.findIndex((k) => k.id === id)
    if (idx !== -1) {
      inMemoryStore[idx] = { ...inMemoryStore[idx], ...payload }
      return inMemoryStore[idx]
    }
    return null
  }
}

/**
 * 删除指定算力配额配置
 */
export const deleteQuotaConfig = async (id: string): Promise<boolean> => {
  try {
    await supabase
      .from('api_key_configs')
      .delete()
      .eq('id', id)
  } catch (err: any) {
    console.error('[Supabase 删除异常]:', err.message)
  }

  inMemoryStore = inMemoryStore.filter((k) => k.id !== id)
  return true
}

/**
 * 探针与配额刷新引擎（调用独立 Provider 策略）
 */
export const probeQuotaConfig = async (config: ApiKeyConfig): Promise<ApiKeyConfig> => {
  const provider = QuotaProviderFactory.getProvider(config.provider)
  const result = await provider.fetchQuota(config)

  const updated: ApiKeyConfig = {
    ...config,
    status: result.status,
    lastTestedAt: result.lastTestedAt,
    tokenQuota: result.tokenQuota,
    quotaInfo: result.quotaInfo,
    rawQuotaData: result.rawQuotaData
  }

  await updateQuotaConfig(config.id, updated)
  return updated
}

/**
 * 批量探针检测所有配置项
 */
export const probeAllQuotaConfigs = async (): Promise<ApiKeyConfig[]> => {
  const configs = await listQuotaConfigs()
  const results = await Promise.all(configs.map((c) => probeQuotaConfig(c)))
  return results
}
