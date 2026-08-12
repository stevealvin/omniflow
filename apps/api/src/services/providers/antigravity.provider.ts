import type { ApiKeyConfig, QuotaFetchResult, TokenPlaneQuota, QuotaDetailItem } from '../../types/index.js'
import type { IQuotaProvider } from './base.provider.js'
import { httpClient } from '../../utils/http.js'

import dayjs from 'dayjs'

const DEFAULT_CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com'
const DEFAULT_CLIENT_SECRET = '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'
const DEFAULT_BASE_URL = 'https://daily-cloudcode-pa.googleapis.com'
const USER_AGENT = 'antigravity/2.6.0 windows/amd64'

const formatDateTime = (date: string | Date | number) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

/**
 * Google Antigravity 托管账号算力配额探针 Provider 策略
 */
export class AntigravityProvider implements IQuotaProvider {
  readonly providerId = 'google-antigravity'

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const cid = process.env.ANTIGRAVITY_CLIENT_ID || DEFAULT_CLIENT_ID
    const sec = process.env.ANTIGRAVITY_CLIENT_SECRET || DEFAULT_CLIENT_SECRET

    for (const clientSecret of [sec, '']) {
      try {
        const payload: Record<string, string> = {
          client_id: cid,
          grant_type: 'refresh_token',
          refresh_token: refreshToken.trim()
        }
        if (clientSecret) payload.client_secret = clientSecret

        const res = await httpClient.post('https://oauth2.googleapis.com/token', new URLSearchParams(payload).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (res.data?.access_token) return res.data.access_token
      } catch {}
    }
    return null
  }

  /**
   * 发起 v1internal:loadCodeAssist 探测 GCP 项目与订阅套餐 (直接获取 paidTier.name)
   */
  private async loadCodeAssist(baseUrl: string, accessToken: string): Promise<{ projectId?: string; planType?: string }> {
    try {
      const res = await httpClient.post(`${baseUrl}/v1internal:loadCodeAssist`, {
        metadata: {
          ideName: 'antigravity',
          ideType: 'ANTIGRAVITY',
          ideVersion: '2.6.0',
          pluginVersion: '1.0.0',
          platform: 'WINDOWS_AMD64',
          updateChannel: 'stable',
          pluginType: 'GEMINI'
        },
        mode: 'FULL_ELIGIBILITY_CHECK'
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'x-goog-api-client': 'gl-node/22.21.1'
        }
      })

      const data = res.data
      const projectObj = data?.cloudaicompanionProject
      const projectId = typeof projectObj === 'string' ? projectObj : projectObj?.id
      const planType = data?.paidTier?.name

      return { projectId, planType }
    } catch {
      return {}
    }
  }

  async fetchQuota(config: ApiKeyConfig): Promise<QuotaFetchResult> {
    const now = new Date().toISOString()
    let token: string | null = null

    // 1. 优先使用 Refresh Token 刷新最新的 Access Token
    if (config.refreshToken && config.refreshToken.trim()) {
      token = await this.refreshAccessToken(config.refreshToken)
    }

    // 2. 若 Refresh 失败或未填 Refresh Token，回退使用配置中的 Access Token 或 API Key
    if (!token) {
      token = config.accessToken || config.apiKey || null
    }

    if (!token) {
      return { status: 'error', lastTestedAt: now }
    }

    const baseUrl = config.baseUrl ? config.baseUrl.replace(/\/+$/, '') : DEFAULT_BASE_URL

    try {
      // 请求 A: loadCodeAssist 获取关联 GCP 项目与真实订阅套餐 (直接获取 paidTier.name)
      const { projectId, planType: detectedPlan } = await this.loadCodeAssist(baseUrl, token)
      const planType = detectedPlan || 'Google AI'

      // 请求 B: v1internal:fetchAvailableModels
      const res = await httpClient.post(`${baseUrl}/v1internal:fetchAvailableModels`, projectId ? { project: projectId } : {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        }
      }).catch(err => {
        if (err.response?.status === 401 && config.accessToken && config.accessToken.trim() && config.accessToken.trim() !== token) {
          return httpClient.post(`${baseUrl}/v1internal:fetchAvailableModels`, projectId ? { project: projectId } : {}, {
            headers: {
              'Authorization': `Bearer ${config.accessToken.trim()}`,
              'Content-Type': 'application/json',
              'User-Agent': USER_AGENT
            }
          })
        }
        throw err
      })

      // 请求 C: v1internal:retrieveUserQuotaSummary (唯一获取 5h / Weekly 专属时间桶额度来源)
      const summaryRes = await httpClient.post(`${baseUrl}/v1internal:retrieveUserQuotaSummary`, projectId ? { project: projectId } : {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        }
      }).catch(() => null)

      const modelsMap = res.data?.models || {}
      const defaultModelId = res.data?.defaultAgentModelId || 'gemini-3.6-flash-high'

      const details: QuotaDetailItem[] = []

      // 仅从 retrieveUserQuotaSummary 中解析 5h / Weekly 配额桶，直接提取 displayName 与 remainingFraction
      const groups = summaryRes?.data?.groups || []
      if (Array.isArray(groups) && groups.length > 0) {
        for (const grp of groups) {
          const buckets = grp.buckets || []
          for (const bkt of buckets) {
            const name = bkt.displayName
            const fraction = bkt.remainingFraction
            const remPct = Math.round(fraction * 100)
            const resetTime = bkt.resetTime
            const secRem = resetTime ? Math.max(0, Math.floor((new Date(resetTime).getTime() - Date.now()) / 1000)) : 0
            const resetStr = resetTime ? formatDateTime(new Date(resetTime)) : '无需重置'

            let groupName = grp.displayName
            if (!groupName) {
              if (name?.toLowerCase().includes('claude')) groupName = 'Claude 算力池'
              else if (name?.toLowerCase().includes('gpt')) groupName = 'GPT-OSS 算力池'
              else groupName = 'Gemini 算力池'
            }

            details.push({
              name,
              providerGroup: groupName,
              remainingPercentage: remPct,
              secondsRemaining: secRem,
              nextResetTime: resetStr
            })
          }
        }
      }

      // 获取主默认模型 (defaultAgentModelId) 额度作为全盘总体数据，直接关联 defaultModelId
      const primaryModel = modelsMap[defaultModelId] || {}
      const primaryFraction = primaryModel.quotaInfo?.remainingFraction ?? 1.0
      const remainingPercentage = Math.round(primaryFraction * 100)
      const primaryResetTime = primaryModel.quotaInfo?.resetTime
      const secondsRemaining = primaryResetTime ? Math.max(0, Math.floor((new Date(primaryResetTime).getTime() - Date.now()) / 1000)) : 18000
      const nextResetTime = primaryResetTime ? formatDateTime(new Date(primaryResetTime)) : formatDateTime(new Date(Date.now() + secondsRemaining * 1000))

      const tokenQuota: TokenPlaneQuota = {
        usedPercentage: Math.max(0, 100 - remainingPercentage),
        remainingPercentage,
        resetIntervalHours: 5,
        secondsRemaining,
        nextResetTime,
        planType,
        details
      }

      const rawQuotaData = {
        models: res.data,
        summary: summaryRes?.data || null
      }

      return { status: 'active', tokenQuota, rawQuotaData, lastTestedAt: now }
    } catch (err: any) {
      console.warn(`[AntigravityProvider] Probe error:`, err.response?.data || err.message)
      return { status: 'error', lastTestedAt: now }
    }
  }
}
