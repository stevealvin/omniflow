import type { ApiKeyConfig, QuotaFetchResult, QuotaModelItem, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

export class AntigravityProvider implements IQuotaProvider {
  readonly providerId = 'google-antigravity'

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const token = config.refreshToken || config.accessToken || config.apiKey || ''
    const now = new Date().toISOString()

    if (!token) {
      return {
        status: 'error',
        lastTestedAt: now
      }
    }

    const baseUrl = config.baseUrl || 'https://daily-cloudcode-pa.googleapis.com'
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/v1internal:fetchAvailableModels`

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'antigravity/1.20.5 windows/amd64'
        },
        body: JSON.stringify({})
      })

      if (!res.ok) {
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const data: any = await res.json()
      const modelsMap = data?.models || {}

      let totalUsed = 0
      let count = 0
      let resetTimeStr = ''
      const modelsList: QuotaModelItem[] = []

      for (const [key, val] of Object.entries<any>(modelsMap)) {
        if (val?.quotaInfo) {
          const remainingFraction = val.quotaInfo.remainingFraction ?? 1.0
          const usedPct = Math.round((1 - remainingFraction) * 100)
          totalUsed += usedPct
          count++

          if (val.quotaInfo.resetTime) {
            resetTimeStr = val.quotaInfo.resetTime
          }

          modelsList.push({
            name: val.displayName || key,
            limit: '额度可用',
            used: `${usedPct}%`
          })
        }
      }

      if (count === 0) {
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const usedPercentage = Math.round(totalUsed / count)
      const remainingPercentage = Math.max(0, 100 - usedPercentage)
      const secondsRemaining = resetTimeStr
        ? Math.max(0, Math.floor((new Date(resetTimeStr).getTime() - Date.now()) / 1000))
        : 18000

      const tokenPlaneQuota: TokenPlaneQuota = {
        usedPercentage,
        remainingPercentage,
        resetIntervalHours: 5,
        secondsRemaining,
        nextResetTime: resetTimeStr ? new Date(resetTimeStr).toLocaleTimeString('zh-CN') : '05:00:00',
        planType: config.planType,
        models: modelsList.length > 0 ? modelsList : undefined,
        rawQuotaData: data // 完整保留并返回上游原始响应 JSON
      }

      return {
        status: remainingPercentage < 15 ? 'error' : 'active',
        tokenPlaneQuota,
        lastTestedAt: now
      }
    } catch (err: any) {
      return {
        status: 'error',
        lastTestedAt: now
      }
    }
  }
}
