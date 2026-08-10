import type { ApiKeyConfig, QuotaFetchResult } from '../../types/index.js'

export interface IQuotaProvider {
  readonly providerId: string
  fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult>
}
