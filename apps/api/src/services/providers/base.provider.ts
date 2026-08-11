import type { ApiKeyConfig, QuotaFetchResult } from '../../types/index.js'

/**
 * AI 算力与 API 密钥探针 Provider 统一接口协议
 */
export interface IQuotaProvider {
  /** Provider 唯一识别标识 */
  readonly providerId: string

  /**
   * 执行探针与配额拉取
   */
  fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult>
}
