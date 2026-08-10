import type { ApiKeyConfig, QuotaFetchResult, ApiKeyQuotaInfo } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

export class OpenAIProvider implements IQuotaProvider {
  readonly providerId = 'openai-compatible'

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const token = config.apiKey || config.refreshToken || config.accessToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://api.openai.com').replace(/\/+$/, '')
    const probeUrl = `${cleanBaseUrl}/v1/models`

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'OmniFlow-QuotaProbe/1.0'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(probeUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const latencyMs = Date.now() - start

      const parseHeaderInt = (name: string): number | undefined => {
        const val = response.headers.get(name) || response.headers.get(`x-${name}`)
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
        response.headers.get('x-ratelimit-reset-requests') ||
        response.headers.get('ratelimit-reset-requests') ||
        response.headers.get('retry-after') ||
        undefined

      const isSuccess = response.ok

      let statusMsg = `HTTP ${response.status} (${response.statusText || 'OK'})`
      if (!isSuccess) {
        if (response.status === 401 || response.status === 403) {
          statusMsg = `HTTP ${response.status} (API Key 未填或鉴权失败)`
        } else if (response.status === 429) {
          statusMsg = `HTTP 429 (超出 Rate-Limit 速率限制)`
        }
      }

      const quotaInfo: ApiKeyQuotaInfo = {
        remainingRequests,
        limitRequests,
        remainingTokens,
        limitTokens,
        resetTimeStr,
        latencyMs,
        statusMessage: statusMsg
      }

      return {
        status: isSuccess ? 'active' : 'error',
        quotaInfo,
        lastTestedAt: now
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start
      return {
        status: 'error',
        quotaInfo: {
          latencyMs,
          statusMessage: `网络请求失败: ${error.name === 'AbortError' ? '请求超时(10s)' : error.message}`
        },
        lastTestedAt: now
      }
    }
  }
}
