import { getQuotaData } from './quota.service.js'

// 核心业务逻辑：处理 Redmi Watch 6 同步
export const getWatchSyncData = async () => {
  const now = new Date()
  
  // 跨服务调用 QuotaService 的业务数据
  const quota = await getQuotaData()

  return {
    appName: '星环流动 Watch',
    batterySave: true,
    antiGravityUsage: quota.antigravity.usedPercentage,
    codexUsage: quota.codex.usedPercentage,
    resetTimeStr: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    statusAlert: false,
    syncTimestamp: Math.floor(now.getTime() / 1000)
  }
}
