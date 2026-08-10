import type { ApiKeyConfig, QuotaFetchResult, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

export class CodexProvider implements IQuotaProvider {
  readonly providerId = 'openai-codex'

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const token = config.accessToken || config.refreshToken || config.apiKey || ''
    const now = new Date().toISOString()

    if (!token) {
      return {
        status: 'error',
        lastTestedAt: now
      }
    }

    const baseUrl = config.baseUrl || 'https://chatgpt.com/backend-api'
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/wham/usage`

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
          'Referer': 'https://chatgpt.com/'
        }
      })

      if (!res.ok) {
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const data: any = await res.json()
      const primaryWin = data?.rate_limit?.primary_window
      const planType = data?.plan_type || config.planType

      if (!primaryWin) {
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const usedPercentage = primaryWin.used_percent ?? 0
      const remainingPercentage = Math.max(0, 100 - usedPercentage)

      let secondsRemaining = 18000
      if (primaryWin.reset_at) {
        secondsRemaining = Math.max(0, primaryWin.reset_at - Math.floor(Date.now() / 1000))
      } else if (primaryWin.reset_after_seconds) {
        secondsRemaining = Math.max(0, primaryWin.reset_after_seconds)
      }

      const resetDate = new Date(Date.now() + secondsRemaining * 1000)

      const tokenPlaneQuota: TokenPlaneQuota = {
        usedPercentage,
        remainingPercentage,
        resetIntervalHours: 5,
        secondsRemaining,
        nextResetTime: resetDate.toLocaleTimeString('zh-CN'),
        planType,
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
