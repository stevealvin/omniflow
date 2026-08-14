import { listQuotaConfigs } from './quota.service.js'
import type { ApiKeyConfig } from '../types/index.js'

export interface WatchSyncData {
  success: boolean
  appName: string
  batterySave: boolean
  syncTimestamp: number
  updatedAt: string
  data: ApiKeyConfig[]
}

/**
 * 核心业务逻辑：处理 Redmi Watch 6 / Xiaomi Vela 穿戴设备算力数据同步（真实数据源）
 */
export const getWatchSyncData = async (): Promise<WatchSyncData> => {
  const now = new Date()

  // 跨服务调用 QuotaService 获取真实配置与配额数据
  const configs = await listQuotaConfigs()

  return {
    success: true,
    appName: '星环流动 Watch',
    batterySave: true,
    syncTimestamp: Math.floor(now.getTime() / 1000),
    updatedAt: now.toISOString(),
    data: configs
  }
}

