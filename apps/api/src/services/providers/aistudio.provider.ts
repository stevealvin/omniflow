import type { ApiKeyConfig, QuotaFetchResult, ApiKeyQuotaInfo } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'
import { httpClient } from '../../utils/http.js'

/**
 * Google AI Studio 密钥探针 Provider 策略
 */
export class AIStudioProvider implements IQuotaProvider {
  readonly providerId = 'google-aistudio'

  /**
   * 执行 Google AI Studio /v1beta/models 接口探针与连通校验
   */
  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const key = config.apiKey || config.refreshToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')
    const probeUrl = key ? `${cleanBaseUrl}/v1beta/models?key=${key}` : `${cleanBaseUrl}/v1beta/models`

    try {
      const response = await httpClient.get(probeUrl)
      const latencyMs = Date.now() - start
      const isSuccess = response.status >= 200 && response.status < 300

      const quotaInfo: ApiKeyQuotaInfo = {
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

      if (status === 400 || status === 403) {
        statusMsg = `HTTP ${status} (Gemini API Key 无效或未授权)`
      } else if (status === 429) {
        statusMsg = `HTTP 429 (超出 AI Studio Rate-Limit 限额)`
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
