import { listQuotaConfigs } from './quota.service.js'

/**
 * 核心业务逻辑：处理 Redmi Watch 6 穿戴设备算力数据同步
 */
export const getWatchSyncData = async () => {
  const now = new Date()

  // 跨服务调用 QuotaService 获取真实配置与配额数据
  const configs = await listQuotaConfigs()

  const ag = configs.find((c) => c.provider === 'google-antigravity')
  const codex = configs.find((c) => c.provider === 'openai-codex')

  return {
    appName: '星环流动 Watch',
    batterySave: true,
    antiGravityUsage: ag?.tokenPlaneQuota?.usedPercentage ?? 0,
    codexUsage: codex?.tokenPlaneQuota?.usedPercentage ?? 0,
    resetTimeStr: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    statusAlert: false,
    syncTimestamp: Math.floor(now.getTime() / 1000)
  }
}
