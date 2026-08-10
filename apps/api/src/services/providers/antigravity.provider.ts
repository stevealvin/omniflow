import type { ApiKeyConfig, QuotaFetchResult, QuotaModelItem, TokenPlaneQuota } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'

// 默认 Google Antigravity OAuth 客户端凭据（已经过 Base64 解码保护，亦可通过环境变量覆写）
const DEFAULT_CLIENT_ID = Buffer.from('MTA3MTAwNjA2MDU5MS10bWhzc2luMmgyMWxjcmUyMzV2dG9sb2poNGc0MDNlcC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbQ==', 'base64').toString('utf-8')
const DEFAULT_CLIENT_SECRET = Buffer.from('R09DU1BYLUs1OEZXUjQ4NkxkTEoxbUxCOHNYQzR6cURBZg==', 'base64').toString('utf-8')

const BASE_URLS = [
  'https://daily-cloudcode-pa.googleapis.com',
  'https://cloudcode-pa.googleapis.com'
]

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

  /**
   * 对齐 Cockpit-Tools 实现：调用 v1internal:loadCodeAssist 获取关联项目与订阅 Tier
   */
  private async loadCodeAssist(baseUrl: string, accessToken: string): Promise<{ projectId?: string; tier?: string }> {
    try {
      const res = await fetch(`${baseUrl}/v1internal:loadCodeAssist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'antigravity/1.20.5 windows/amd64 google-api-nodejs-client/10.3.0',
          'x-goog-api-client': 'gl-node/22.21.1',
          'Accept': '*/*'
        },
        body: JSON.stringify({
          metadata: {
            ideName: 'antigravity',
            ideType: 'ANTIGRAVITY',
            ideVersion: '1.20.5',
            pluginVersion: '1.0.0',
            platform: 'WINDOWS_AMD64',
            updateChannel: 'stable',
            pluginType: 'GEMINI'
          },
          mode: 'FULL_ELIGIBILITY_CHECK'
        })
      })

      if (!res.ok) {
        return {}
      }

      const data: any = await res.json()
      const projectObj = data?.cloudaicompanionProject
      const projectId = typeof projectObj === 'string' ? projectObj : projectObj?.id || undefined
      const tier = data?.paidTier?.id || data?.currentTier?.id || data?.currentTier?.name || undefined

      return { projectId, tier }
    } catch {
      return {}
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

    // 构建待测试的候选域名列表（包含配置自定义域名与 Cockpit-Tools 对齐的 Daily & Prod 双域名回退）
    const candidateUrls: string[] = []
    if (config.baseUrl) {
      candidateUrls.push(config.baseUrl.replace(/\/+$/, ''))
    }
    for (const url of BASE_URLS) {
      if (!candidateUrls.includes(url)) {
        candidateUrls.push(url)
      }
    }

    for (const baseUrl of candidateUrls) {
      try {
        // 对齐 Cockpit-Tools：优先获取 loadCodeAssist 项目上下文
        const { projectId, tier } = await this.loadCodeAssist(baseUrl, validAccessToken)

        const targetUrl = `${baseUrl}/v1internal:fetchAvailableModels`
        const payload = projectId ? { project: projectId } : {}

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${validAccessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'antigravity/1.20.5 windows/amd64'
          },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          console.warn(`[AntigravityProvider] Endpoint ${baseUrl} returned status: ${res.status}, trying next candidate...`)
          continue
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
          continue
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
          planType: config.planType || tier || 'Pro / Priority',
          models: modelsList.length > 0 ? modelsList : undefined,
          rawQuotaData: data
        }

        return {
          status: remainingPercentage < 15 ? 'error' : 'active',
          tokenPlaneQuota,
          lastTestedAt: now
        }
      } catch (err: any) {
        console.warn(`[AntigravityProvider] Failed probing ${baseUrl}:`, err.message)
      }
    }

    return {
      status: 'error',
      lastTestedAt: now
    }
  }
}
