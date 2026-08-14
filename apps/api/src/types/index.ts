// 分类明细额度结构（如 Gemini、Claude 等模型分组）
export interface QuotaDetailItem {
  name: string
  providerGroup: string // 'Gemini' | 'Claude' | 'OpenAI' | 'Other'
  remainingPercentage: number
  secondsRemaining: number
  nextResetTime: string
}

// 专属 Token Plane 算力配额结构（仅在真实查得上游配额时存在，无数据时为 undefined）
export interface TokenPlaneQuota {
  usedPercentage: number
  remainingPercentage: number
  status?: 'healthy' | 'warning' | 'exhausted' | 'untested'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  planType?: string
  details?: QuotaDetailItem[] // 通用配额分类明细列表
}

// API Key 专属 Rate-Limit 探针信息
export interface ApiKeyQuotaInfo {
  remainingRequests?: number
  remainingTokens?: number
  limitRequests?: number
  limitTokens?: number
  resetTimeStr?: string
  latencyMs?: number
  statusMessage?: string
}

// 全局 AI 算力大盘展示项
export interface QuotaItem {
  id: string
  name: string
  tier: string
  usedPercentage: number
  remainingPercentage: number
  status: 'healthy' | 'warning' | 'exhausted' | 'untested'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  rawQuotaData?: any
}

export type KeyQuotaType = 'token-plane' | 'api-key'

// 通用 API Key 与 Token Plane 额度配置定义
export interface ApiKeyConfig {
  id: string
  name: string
  type: KeyQuotaType // 'token-plane' | 'api-key'
  provider: 'google-antigravity' | 'openai-codex' | 'openai-compatible' | 'google-aistudio' | 'generic'
  baseUrl: string
  apiKey?: string
  refreshToken?: string
  accessToken?: string
  status: 'active' | 'error' | 'untested'
  lastTestedAt?: string
  email?: string

  tokenQuota?: TokenPlaneQuota
  quotaInfo?: ApiKeyQuotaInfo
  rawQuotaData?: any
}

// 策略模式 Provider 执行返回数据结构
export interface QuotaFetchResult {
  status: 'active' | 'error' | 'untested'
  tokenQuota?: TokenPlaneQuota
  quotaInfo?: ApiKeyQuotaInfo
  rawQuotaData?: any
  lastTestedAt: string
}
