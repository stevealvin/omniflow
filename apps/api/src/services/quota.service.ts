import type { QuotaItem } from '../types/index.js'
import { supabase } from '../utils/supabase.js'
import { QuotaProviderFactory } from './providers/factory.js'

// 实时基于 Supabase 数据库与上游 API 策略模块聚合全局算力数据
export const getQuotaData = async (): Promise<Record<string, QuotaItem>> => {
  const result: Record<string, QuotaItem> = {
    antigravity: {
      id: 'antigravity',
      name: 'Google Antigravity',
      tier: '',
      usedPercentage: 0,
      remainingPercentage: 100,
      status: 'untested',
      resetIntervalHours: 5,
      secondsRemaining: 18000,
      nextResetTime: '05:00:00'
    },
    codex: {
      id: 'codex',
      name: 'OpenAI Codex / Copilot',
      tier: '',
      usedPercentage: 0,
      remainingPercentage: 100,
      status: 'untested',
      resetIntervalHours: 5,
      secondsRemaining: 18000,
      nextResetTime: '05:00:00'
    }
  }

  try {
    const { data } = await supabase
      .from('api_key_configs')
      .select('*')
      .eq('type', 'token-plane')

    if (data && data.length > 0) {
      const agAccount = data.find((r) => r.provider === 'google-antigravity')
      const codexAccount = data.find((r) => r.provider === 'openai-codex')

      if (agAccount) {
        const provider = QuotaProviderFactory.getProvider('google-antigravity')
        const fetchRes = await provider.fetchQuota({
          id: agAccount.id,
          name: agAccount.name,
          type: 'token-plane',
          provider: 'google-antigravity',
          baseUrl: agAccount.base_url || 'https://daily-cloudcode-pa.googleapis.com',
          apiKey: agAccount.api_key || '',
          refreshToken: agAccount.refresh_token || agAccount.api_key || '',
          accessToken: agAccount.access_token || '',
          model: agAccount.model || '',
          status: 'untested'
        })

        if (fetchRes.tokenPlaneQuota) {
          result.antigravity = {
            id: 'antigravity',
            name: agAccount.name || 'Google Antigravity',
            tier: fetchRes.tokenPlaneQuota.planType || '',
            usedPercentage: fetchRes.tokenPlaneQuota.usedPercentage,
            remainingPercentage: fetchRes.tokenPlaneQuota.remainingPercentage,
            status: fetchRes.status === 'active' ? 'healthy' : 'warning',
            resetIntervalHours: fetchRes.tokenPlaneQuota.resetIntervalHours,
            secondsRemaining: fetchRes.tokenPlaneQuota.secondsRemaining,
            nextResetTime: fetchRes.tokenPlaneQuota.nextResetTime,
            models: fetchRes.tokenPlaneQuota.models
          }
        }
      }

      if (codexAccount) {
        const provider = QuotaProviderFactory.getProvider('openai-codex')
        const fetchRes = await provider.fetchQuota({
          id: codexAccount.id,
          name: codexAccount.name,
          type: 'token-plane',
          provider: 'openai-codex',
          baseUrl: codexAccount.base_url || 'https://chatgpt.com/backend-api',
          apiKey: codexAccount.api_key || '',
          refreshToken: codexAccount.refresh_token || '',
          accessToken: codexAccount.access_token || codexAccount.api_key || '',
          model: codexAccount.model || '',
          status: 'untested'
        })

        if (fetchRes.tokenPlaneQuota) {
          result.codex = {
            id: 'codex',
            name: codexAccount.name || 'OpenAI Codex',
            tier: fetchRes.tokenPlaneQuota.planType || '',
            usedPercentage: fetchRes.tokenPlaneQuota.usedPercentage,
            remainingPercentage: fetchRes.tokenPlaneQuota.remainingPercentage,
            status: fetchRes.status === 'active' ? 'healthy' : 'warning',
            resetIntervalHours: fetchRes.tokenPlaneQuota.resetIntervalHours,
            secondsRemaining: fetchRes.tokenPlaneQuota.secondsRemaining,
            nextResetTime: fetchRes.tokenPlaneQuota.nextResetTime,
            models: fetchRes.tokenPlaneQuota.models
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[Supabase 数据获取失败]', err.message)
  }

  return result
}
