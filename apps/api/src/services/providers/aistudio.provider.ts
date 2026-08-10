import type { ApiKeyConfig, QuotaFetchResult, ApiKeyQuotaInfo } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

export class AIStudioProvider implements IQuotaProvider {
  readonly providerId = 'google-aistudio'

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const key = config.apiKey || config.refreshToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')
    const probeUrl = key ? `${cleanBaseUrl}/v1beta/models?key=${key}` : `${cleanBaseUrl}/v1beta/models`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(probeUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const latencyMs = Date.now() - start
      const isSuccess = response.ok

      let statusMsg = `HTTP ${response.status} (${response.statusText || 'OK'})`
      if (!isSuccess) {
        if (response.status === 400 || response.status === 403) {
          statusMsg = `HTTP ${response.status} (Gemini API Key 无效或未授权)`
        } else if (response.status === 429) {
          statusMsg = `HTTP 429 (超出 AI Studio Rate-Limit 限额)`
        }
      }

      const quotaInfo: ApiKeyQuotaInfo = {
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
