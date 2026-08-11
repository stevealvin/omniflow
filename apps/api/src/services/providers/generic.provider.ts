import type { ApiKeyConfig, QuotaFetchResult } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'
import { httpClient } from '../../utils/http.js'

/**
 * 其他通用 API 密钥探针 Provider 回退策略
 */
export class GenericProvider implements IQuotaProvider {
  readonly providerId = 'generic'

  /**
   * 执行通用 API 密钥 HTTP 连通性与延迟探针
   */
  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const start = Date.now()
    const now = new Date().toISOString()
    const token = config.apiKey || config.refreshToken || ''
    const cleanBaseUrl = (config.baseUrl || 'https://').replace(/\/+$/, '')
    const probeUrl = `${cleanBaseUrl}/v1/models`

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await httpClient.get(probeUrl, { headers })
      const latencyMs = Date.now() - start
      const isSuccess = response.status >= 200 && response.status < 300

      return {
        status: isSuccess ? 'active' : 'error',
        quotaInfo: {
          latencyMs,
          statusMessage: `HTTP ${response.status} (OK)`
        },
        lastTestedAt: now
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start
      const status = error.response?.status
      const statusMsg = status
        ? `HTTP ${status} (${error.response?.statusText || 'Error'})`
        : `网络请求失败: ${error.message}`

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
