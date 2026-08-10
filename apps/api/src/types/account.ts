export type AccountPlatform = 'antigravity' | 'codex' | 'claude' | 'deepseek'

export interface QuotaModel {
  name: string
  limit?: string
  used: string
}

export interface AccountQuota {
  usedPercentage: number
  remainingPercentage: number
  status: 'healthy' | 'warning' | 'exhausted' | 'untested'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  models?: QuotaModel[]
  planType?: string
  lastUpdated?: string
}

export interface AccountBase {
  id: string
  platform: AccountPlatform
  email: string
  name: string
  status: 'active' | 'error' | 'disabled'
  quota: AccountQuota
  createdAt: string
  updatedAt: string
}

export interface AntigravityAccount extends AccountBase {
  platform: 'antigravity'
  refreshToken: string
  projectId?: string
  isGcpTos?: boolean
}

export interface CodexAccount extends AccountBase {
  platform: 'codex'
  authType: 'oauth' | 'api_key'
  accessToken?: string
  apiKey?: string
  planType?: string
  resetCredits?: number
}

export type ManagedAccount = AntigravityAccount | CodexAccount

export interface CreateAntigravityAccountInput {
  email: string
  name?: string
  refreshToken: string
  projectId?: string
}

export interface CreateCodexAccountInput {
  email: string
  name?: string
  authType: 'oauth' | 'api_key'
  accessToken?: string
  apiKey?: string
  planType?: string
}
