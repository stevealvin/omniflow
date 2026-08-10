import type { ApiKeyConfig, QuotaFetchResult, QuotaModelItem, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

// 默认 Google Antigravity OAuth 客户端凭据（已经过 Base64 解码保护，亦可通过环境变量覆写）
const DEFAULT_CLIENT_ID = Buffer.from('MTA3MTAwNjA2MDU5MS10bWhzc2luMmgyMWxjcmUyMzV2dG9sb2poNGc0MDNlcC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbQ==', 'base64').toString('utf-8')
const DEFAULT_CLIENT_SECRET = Buffer.from('R09DU1BYLUs1OEZXUjQ4NkxkTEoxbUxCOHNYQzR6cURBZg==', 'base64').toString('utf-8')

export class AntigravityProvider implements IQuotaProvider {
  readonly providerId = 'google-antigravity'

  /**
   * 自动解析与容错：支持用户传入纯文本 Token 或完整凭据 JSON 字符串
   */
  private parseTokens(config: ApiKeyConfig): { refreshToken: string | null; accessToken: string | null } {
    let refreshToken: string | null = config.refreshToken ? config.refreshToken.trim() : null
    const rawAccess = config.accessToken || config.apiKey
    let accessToken: string | null = rawAccess ? rawAccess.trim() : null

    // 检查是否有任何输入框粘贴了完整的凭据 JSON
    const rawList = [config.refreshToken, config.accessToken, config.apiKey]
    const candidates: string[] = rawList.filter((x): x is string => Boolean(x && typeof x === 'string'))

    for (const raw of candidates) {
      const trimmed = raw.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed)
          const tokenObj = parsed?.token || parsed
          if (tokenObj?.refresh_token && typeof tokenObj.refresh_token === 'string') {
            refreshToken = tokenObj.refresh_token.trim()
          }
          if (tokenObj?.access_token && typeof tokenObj.access_token === 'string') {
            accessToken = tokenObj.access_token.trim()
          }
        } catch {
          // 非标准 JSON，忽略跳过
        }
      }
    }

    return { refreshToken, accessToken }
  }

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const clientId = process.env.ANTIGRAVITY_CLIENT_ID || DEFAULT_CLIENT_ID
      const clientSecret = process.env.ANTIGRAVITY_CLIENT_SECRET || DEFAULT_CLIENT_SECRET

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken.trim()
        })
      })

      if (!res.ok) {
        console.error('[AntigravityProvider] OAuth refresh failed with status:', res.status)
        return null
      }

      const data: any = await res.json()
      return data?.access_token || null
    } catch (err) {
      console.error('[AntigravityProvider] OAuth refresh error:', err)
      return null
    }
  }

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const now = new Date().toISOString()
    const { refreshToken, accessToken: fallbackAccessToken } = this.parseTokens(config)
    let validAccessToken: string | null = null

    // 1. 若提取到了 Refresh Token (以 1// 开头)，优先自动向 Google OAuth 换取最新有效的临时 Access Token
    if (refreshToken) {
      validAccessToken = await this.refreshAccessToken(refreshToken)
    }

    // 2. 若 Refresh Token 换取失败或未提供，回退使用提出来的 Access Token (以 ya29. 开头)
    if (!validAccessToken) {
      validAccessToken = fallbackAccessToken
    }

    if (!validAccessToken) {
      console.error('[AntigravityProvider] 缺失有效的 Access Token 或 Refresh Token')
      return {
        status: 'error',
        lastTestedAt: now
      }
    }

    const baseUrl = config.baseUrl || 'https://daily-cloudcode-pa.googleapis.com'
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/v1internal:fetchAvailableModels`

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'antigravity/1.20.5 windows/amd64'
        },
        body: JSON.stringify({})
      })

      if (!res.ok) {
        console.error('[AntigravityProvider] Probe HTTP error:', res.status, res.statusText)
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const data: any = await res.json()
      const modelsMap = data?.models || {}

      let totalUsed = 0
      let count = 0
      let resetTimeStr = ''
      const modelsList: QuotaModelItem[] = []

      for (const [key, val] of Object.entries<any>(modelsMap)) {
        if (val?.quotaInfo) {
          const remainingFraction = val.quotaInfo.remainingFraction ?? 1.0
          const usedPct = Math.round((1 - remainingFraction) * 100)
          totalUsed += usedPct
          count++

          if (val.quotaInfo.resetTime && (!resetTimeStr || new Date(val.quotaInfo.resetTime) < new Date(resetTimeStr))) {
            resetTimeStr = val.quotaInfo.resetTime
          }

          modelsList.push({
            name: val.displayName || key,
            limit: '额度可用',
            used: `${usedPct}%`
          })
        }
      }

      if (count === 0) {
        return {
          status: 'error',
          lastTestedAt: now
        }
      }

      const usedPercentage = Math.round(totalUsed / count)
      const remainingPercentage = Math.max(0, 100 - usedPercentage)
      const secondsRemaining = resetTimeStr
        ? Math.max(0, Math.floor((new Date(resetTimeStr).getTime() - Date.now()) / 1000))
        : 18000

      const tokenPlaneQuota: TokenPlaneQuota = {
        usedPercentage,
        remainingPercentage,
        resetIntervalHours: 5,
        secondsRemaining,
        nextResetTime: resetTimeStr ? new Date(resetTimeStr).toLocaleTimeString('zh-CN') : '05:00:00',
        planType: config.planType || 'Pro / Priority',
        models: modelsList.length > 0 ? modelsList : undefined,
        rawQuotaData: data
      }

      return {
        status: remainingPercentage < 15 ? 'error' : 'active',
        tokenPlaneQuota,
        lastTestedAt: now
      }
    } catch (err: any) {
      console.error('[AntigravityProvider] Probe exception:', err)
      return {
        status: 'error',
        lastTestedAt: now
      }
    }
  }
}
