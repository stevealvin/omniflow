import { supabase } from '../utils/supabase.js'
import type { ApiKeyConfig } from '../types/index.js'
import { QuotaProviderFactory } from './providers/factory.js'

// DB 结果字段与 TS 类型的转换映射
const mapDbToConfig = (row: any): ApiKeyConfig => {
  return {
    id: row.id,
    name: row.name,
    type: row.type || 'token-plane',
    provider: row.provider,
    baseUrl: row.base_url || '',
    apiKey: row.api_key || '',
    refreshToken: row.refresh_token || row.api_key || '',
    accessToken: row.access_token || '',
    model: row.model || '',
    email: row.email || '',
    status: row.status || 'untested',
    lastTestedAt: row.last_tested_at || undefined,
    tokenPlaneQuota: row.token_plane_quota || undefined,
    quotaInfo: row.quota_info || undefined
  }
}

const mapConfigToDb = (config: Partial<ApiKeyConfig>) => {
  const dbData: Record<string, any> = {}
  if (config.id !== undefined) dbData.id = config.id
  if (config.name !== undefined) dbData.name = config.name
  if (config.type !== undefined) dbData.type = config.type
  if (config.provider !== undefined) dbData.provider = config.provider
  if (config.baseUrl !== undefined) dbData.base_url = config.baseUrl
  if (config.apiKey !== undefined) dbData.api_key = config.apiKey
  if (config.refreshToken !== undefined) dbData.refresh_token = config.refreshToken
  if (config.accessToken !== undefined) dbData.access_token = config.accessToken
  if (config.model !== undefined) dbData.model = config.model
  if (config.email !== undefined) dbData.email = config.email
  if (config.status !== undefined) dbData.status = config.status
  if (config.lastTestedAt !== undefined) dbData.last_tested_at = config.lastTestedAt
  if (config.tokenPlaneQuota !== undefined) dbData.token_plane_quota = config.tokenPlaneQuota
  if (config.quotaInfo !== undefined) dbData.quota_info = config.quotaInfo
  return dbData
}

let inMemoryStore: ApiKeyConfig[] = []

// 1. 获取所有 API 密钥与 Token Plane 托管账号
export const listApiKeys = async (): Promise<ApiKeyConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('api_key_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return inMemoryStore
    }

    return data.map((row) => mapDbToConfig(row))
  } catch (err: any) {
    console.warn('[Supabase 读取提示]', err.message)
    return inMemoryStore
  }
}

// 2. 添加 API Key 或 Token Plane 账号（使用策略模式动态调度）
export const addApiKey = async (payload: Omit<ApiKeyConfig, 'id' | 'status'>): Promise<ApiKeyConfig> => {
  const isTokenPlane = payload.type === 'token-plane' || payload.provider === 'google-antigravity' || payload.provider === 'openai-codex'

  const tempKey: ApiKeyConfig = {
    ...payload,
    type: isTokenPlane ? 'token-plane' : 'api-key',
    id: `${isTokenPlane ? 'token' : 'key'}-${Date.now()}`,
    status: 'untested'
  }

  // 通过策略工厂获取 Provider 独立策略并执行
  const provider = QuotaProviderFactory.getProvider(payload.provider)
  const fetchResult = await provider.fetchQuota(tempKey)

  const newKey: ApiKeyConfig = {
    ...tempKey,
    status: fetchResult.status,
    lastTestedAt: fetchResult.lastTestedAt,
    tokenPlaneQuota: fetchResult.tokenPlaneQuota, // 无数据时为 undefined，取消默认假数据填充
    quotaInfo: fetchResult.quotaInfo
  }

  try {
    const dbPayload = mapConfigToDb(newKey)
    const { data, error } = await supabase
      .from('api_key_configs')
      .insert([dbPayload])
      .select('*')

    if (error || !data || data.length === 0) {
      inMemoryStore.unshift(newKey)
      return newKey
    }

    return mapDbToConfig(data[0])
  } catch (err: any) {
    console.error('[Supabase 写入异常]:', err.message)
    inMemoryStore.unshift(newKey)
    return newKey
  }
}

// 3. 更新配置
export const updateApiKey = async (id: string, payload: Partial<ApiKeyConfig>): Promise<ApiKeyConfig | null> => {
  try {
    const dbPayload = mapConfigToDb(payload)
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

    return mapDbToConfig(data[0])
  } catch (err: any) {
    const idx = inMemoryStore.findIndex((k) => k.id === id)
    if (idx !== -1) {
      inMemoryStore[idx] = { ...inMemoryStore[idx], ...payload }
      return inMemoryStore[idx]
    }
    return null
  }
}

// 4. 删除密钥/账号
export const deleteApiKey = async (id: string): Promise<boolean> => {
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

// 5. 探针/配额刷新引擎（使用策略模式动态调度）
export const probeKeyQuota = async (key: ApiKeyConfig): Promise<ApiKeyConfig> => {
  const provider = QuotaProviderFactory.getProvider(key.provider)
  const result = await provider.fetchQuota(key)

  console.log(result);
  

  const updated: ApiKeyConfig = {
    ...key,
    status: result.status,
    lastTestedAt: result.lastTestedAt,
    tokenPlaneQuota: result.tokenPlaneQuota, // 无数据时保留 undefined
    quotaInfo: result.quotaInfo
  }

  await updateApiKey(key.id, updated)
  return updated
}

// 6. 批量探针检测所有项
export const probeAllKeyQuotas = async (): Promise<ApiKeyConfig[]> => {
  const keys = await listApiKeys()
  const results = await Promise.all(keys.map((k) => probeKeyQuota(k)))
  return results
}
