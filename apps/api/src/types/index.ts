// AI 算力与模型配额细分定义
export interface QuotaModelItem {
  name: string
  limit: string
  used: string
}

// 单个 AI 服务配额状态定义
export interface QuotaItem {
  id: string
  name: string
  tier: string
  usedPercentage: number
  remainingPercentage: number
  status: 'healthy' | 'warning' | 'exhausted'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  models?: QuotaModelItem[]
}

export type KeyQuotaType = 'token-plane' | 'api-key'

// 通用 API Key 与 Token Plane 额度/Rate-Limit 配置定义
export interface ApiKeyConfig {
  id: string
  name: string
  type: KeyQuotaType // 'token-plane' | 'api-key'
  provider: 'google-antigravity' | 'openai-codex' | 'openai-compatible' | 'google-aistudio' | 'anthropic' | 'generic'
  baseUrl: string
  apiKey: string // 对 Token Plane 而言可作为 Refresh Token 或 Access Token
  model: string
  status: 'active' | 'error' | 'untested'
  lastTestedAt?: string
  
  // Token Plane 专属扩展信息 (Antigravity & Codex)
  email?: string
  planType?: string
  tokenPlaneQuota?: {
    usedPercentage: number
    remainingPercentage: number
    resetIntervalHours: number
    secondsRemaining: number
    nextResetTime: string
    subscriptionTier?: string
    models?: QuotaModelItem[]
  }

  // API Key 专属 Rate-Limit 信息
  quotaInfo?: {
    remainingRequests?: number
    remainingTokens?: number
    limitRequests?: number
    limitTokens?: number
    resetTimeStr?: string
    latencyMs?: number
    statusMessage?: string
  }
}
