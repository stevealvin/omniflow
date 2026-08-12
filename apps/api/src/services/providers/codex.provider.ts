import type { ApiKeyConfig, QuotaFetchResult, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'
import { httpClient } from '../../utils/http.js'

import dayjs from 'dayjs'

/**
 * 格式化年月日 时分秒 (YYYY-MM-DD HH:mm:ss)
 */
const formatFullDateTime = (date: string | Date | number) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

/**
 * OpenAI Codex / Wham 托管账号配额探针 Provider 策略
 */
export class CodexProvider implements IQuotaProvider {
  readonly providerId = 'openai-codex'

  /**
   * 执行 OpenAI Codex /wham/usage 接口探针并解析配额
   */
  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const token = config.accessToken || config.refreshToken || config.apiKey || ''
    const now = new Date().toISOString()

    if (!token) {
      return { status: 'error', lastTestedAt: now }
    }

    const baseUrl = config.baseUrl ? config.baseUrl.replace(/\/+$/, '') : 'https://chatgpt.com/backend-api'
    const targetUrl = `${baseUrl}/wham/usage`

    try {
      const res = await httpClient.get(targetUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const data = res.data
      const primaryWindow = data?.primary_window || {}
      const usedPct = primaryWindow.used_percentage ?? 0
      const remainingPercentage = Math.max(0, 100 - usedPct)
      const secRem = primaryWindow.reset_time_remaining_seconds || 10800
      const nextReset = formatFullDateTime(new Date(Date.now() + secRem * 1000))

      const tokenQuota: TokenPlaneQuota = {
        usedPercentage: usedPct,
        remainingPercentage,
        resetIntervalHours: 3,
        secondsRemaining: secRem,
        nextResetTime: nextReset,
        planType: data?.plan_type || 'Plus / Team'
      }

      return { status: 'active', tokenQuota, rawQuotaData: data, lastTestedAt: now }
    } catch (err: any) {
      console.warn(`[CodexProvider] Probe error:`, err.response?.data || err.message)
      return { status: 'error', lastTestedAt: now }
    }
  }
}
