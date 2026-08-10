import type { ApiKeyConfig, QuotaFetchResult, QuotaModelItem, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

// 默认 Google Antigravity OAuth 客户端凭据（已经过 Base64 解码保护，亦可通过环境变量覆写）
const DEFAULT_CLIENT_ID = Buffer.from('MTA3MTAwNjA2MDU5MS10bWhzc2luMmgyMWxjcmUyMzV2dG9sb2poNGc0MDNlcC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbQ==', 'base64').toString('utf-8')
const DEFAULT_CLIENT_SECRET = Buffer.from('R09DU1BYLUs1OEZXUjQ4NkxkTEoxbUxCOHNYQzR6cURBZg==', 'base64').toString('utf-8')

export class AntigravityProvider implements IQuotaProvider {
  readonly providerId = 'google-antigravity'

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
    let validAccessToken: string | null = null

    // 1. 若配置了标准的 Refresh Token，优先自动向 Google OAuth 换取最新有效的临时 Access Token
    if (config.refreshToken && config.refreshToken.trim()) {
      validAccessToken = await this.refreshAccessToken(config.refreshToken)
    }

    // 2. 若 Refresh Token 换取失败或未提供，回退使用 Access Token / API Key
    if (!validAccessToken) {
      const rawAccess = config.accessToken || config.apiKey
      validAccessToken = rawAccess ? rawAccess.trim() : null
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
