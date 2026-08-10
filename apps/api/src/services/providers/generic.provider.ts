import type { ApiKeyConfig, QuotaFetchResult } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

export class GenericProvider implements IQuotaProvider {
  readonly providerId = 'generic'

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const token = config.apiKey || config.refreshToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://').replace(/\/+$/, '')
    const probeUrl = `${cleanBaseUrl}/v1/models`

    const headers: Record<string, string> = {
      'Accept': 'application/json'
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
      const isSuccess = response.ok

      return {
        status: isSuccess ? 'active' : 'error',
        quotaInfo: {
          latencyMs,
          statusMessage: `HTTP ${response.status} (${response.statusText || 'OK'})`
        },
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
