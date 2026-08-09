import type { QuotaItem } from '../types/index.js'
import { supabase } from '../utils/supabase.js'

// 核心业务逻辑：计算 5小时 循环重置时间与剩余秒数
export const calculateQuotaResetTime = () => {
  const now = new Date()
  const resetWindowMs = 5 * 60 * 60 * 1000
  const currentEpoch = now.getTime()
  const nextResetTimeEpoch = Math.ceil(currentEpoch / resetWindowMs) * resetWindowMs
  const secondsRemaining = Math.max(0, Math.floor((nextResetTimeEpoch - currentEpoch) / 1000))
  const resetTimeString = new Date(nextResetTimeEpoch).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return { secondsRemaining, resetTimeString, now }
}

// 核心业务逻辑：获取全局 AI 算力与额度数据（实时基于 Supabase 托管数据动态聚合）
export const getQuotaData = async (): Promise<Record<string, QuotaItem>> => {
  const { secondsRemaining, resetTimeString } = calculateQuotaResetTime()

  // 默认空/基础配额映射
  const defaultMap: Record<string, QuotaItem> = {
    antigravity: {
      id: 'antigravity',
      name: 'Google Antigravity',
      tier: 'Pro / Ultra 优先配额',
      usedPercentage: 35,
      remainingPercentage: 65,
      status: 'healthy',
      resetIntervalHours: 5,
      secondsRemaining,
      nextResetTime: resetTimeString,
      models: [
        { name: 'Gemini 3.6 Flash (High)', limit: '高优先级算力', used: '35%' },
        { name: 'Gemini 3.6 Pro', limit: '海量 Token 额度', used: '28%' }
      ]
    },
    codex: {
      id: 'codex',
      name: 'OpenAI Codex / Copilot',
      tier: '开发者 Pro 版',
      usedPercentage: 42,
      remainingPercentage: 58,
      status: 'healthy',
      resetIntervalHours: 5,
      secondsRemaining: secondsRemaining + 120,
      nextResetTime: resetTimeString,
      models: [
        { name: 'gpt-4o-codex', limit: '500 请求 / 5小时', used: '42%' },
        { name: 'o3-mini-reasoning', limit: '200 请求 / 5小时', used: '18%' }
      ]
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

      if (agAccount && agAccount.token_plane_quota) {
        defaultMap.antigravity = {
          ...defaultMap.antigravity,
          name: agAccount.name || 'Google Antigravity',
          tier: agAccount.plan_type || 'Pro / Ultra 优先配额',
          usedPercentage: agAccount.token_plane_quota.usedPercentage ?? 35,
          remainingPercentage: agAccount.token_plane_quota.remainingPercentage ?? 65,
          secondsRemaining,
          nextResetTime: resetTimeString
        }
      }

      if (codexAccount && codexAccount.token_plane_quota) {
        defaultMap.codex = {
          ...defaultMap.codex,
          name: codexAccount.name || 'OpenAI Codex',
          tier: codexAccount.plan_type || '开发者 Pro 版',
          usedPercentage: codexAccount.token_plane_quota.usedPercentage ?? 42,
          remainingPercentage: codexAccount.token_plane_quota.remainingPercentage ?? 58,
          secondsRemaining,
          nextResetTime: resetTimeString
        }
      }
    }
  } catch (err: any) {
    console.warn('[Supabase 动态聚合分析提示]', err.message)
  }

  return defaultMap
}
