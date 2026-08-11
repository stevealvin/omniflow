import type { ApiKeyConfig, QuotaFetchResult, ApiKeyQuotaInfo } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'
import { httpClient } from '../../utils/http.js'

/**
 * OpenAI Compatible 通用 API 探针 Provider 策略
 */
export class OpenAIProvider implements IQuotaProvider {
  readonly providerId = 'openai-compatible'

  /**
   * 执行 OpenAI / DeepSeek Compatible /v1/models HTTP 探针并解析响应头 Rate-Limit 指标
   */
  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const token = config.apiKey || config.refreshToken || config.accessToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://api.openai.com').replace(/\/+$/, '')
    const probeUrl = `${cleanBaseUrl}/v1/models`

    const headers: Record<string, string> = {
      'User-Agent': 'OmniFlow-QuotaProbe/1.0'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await httpClient.get(probeUrl, { headers })
      const latencyMs = Date.now() - start
      const resHeaders = response.headers || {}

      const getHeaderVal = (name: string): string | undefined => {
        const val = resHeaders[name.toLowerCase()]
        if (Array.isArray(val)) return val[0]
        return val ? String(val) : undefined
      }

      const parseHeaderInt = (name: string): number | undefined => {
        const val = getHeaderVal(name) || getHeaderVal(`x-${name}`)
        if (!val) return undefined
        const parsed = parseInt(val, 10)
        return isNaN(parsed) ? undefined : parsed
      }

      const remainingRequests =
        parseHeaderInt('ratelimit-remaining-requests') ??
        parseHeaderInt('x-ratelimit-remaining-requests') ??
        parseHeaderInt('ratelimit-remaining') ??
        parseHeaderInt('x-ratelimit-remaining')

      const limitRequests =
        parseHeaderInt('ratelimit-limit-requests') ??
        parseHeaderInt('x-ratelimit-limit-requests') ??
        parseHeaderInt('ratelimit-limit') ??
        parseHeaderInt('x-ratelimit-limit')

      const remainingTokens =
        parseHeaderInt('ratelimit-remaining-tokens') ??
        parseHeaderInt('x-ratelimit-remaining-tokens')

      const limitTokens =
        parseHeaderInt('ratelimit-limit-tokens') ??
        parseHeaderInt('x-ratelimit-limit-tokens')

      const resetTimeStr =
        getHeaderVal('x-ratelimit-reset-requests') ||
        getHeaderVal('ratelimit-reset-requests') ||
        getHeaderVal('retry-after') ||
        undefined

      const isSuccess = response.status >= 200 && response.status < 300

      const quotaInfo: ApiKeyQuotaInfo = {
        remainingRequests,
        limitRequests,
        remainingTokens,
        limitTokens,
        resetTimeStr,
        latencyMs,
        statusMessage: `HTTP ${response.status} (OK)`
      }

      return {
        status: isSuccess ? 'active' : 'error',
        quotaInfo,
        lastTestedAt: now
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start
      const status = error.response?.status
      let statusMsg = error.message

      if (status === 401 || status === 403) {
        statusMsg = `HTTP ${status} (API Key 未填或鉴权失败)`
      } else if (status === 429) {
        statusMsg = `HTTP 429 (超出 Rate-Limit 速率限制)`
      } else if (status) {
        statusMsg = `HTTP ${status} (${error.response?.statusText || 'Error'})`
      }

      return {
        status: 'error',
        quotaInfo: {
          latencyMs,
          statusMessage: statusMsg
        },
        lastTestedAt: now
      }
    }
  }
}
