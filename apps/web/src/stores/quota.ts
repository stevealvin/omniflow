import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/utils/http'

export interface QuotaModelItem {
  name: string
  limit: string
  used: string
}

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

export interface ManagedAccount {
  id: string
  platform: 'antigravity' | 'codex' | 'claude' | 'deepseek'
  email: string
  name: string
  status: 'active' | 'error' | 'disabled'
  quota: QuotaItem
  createdAt: string
  updatedAt: string
  refreshToken?: string
  authType?: string
  planType?: string
}

export const useQuotaStore = defineStore('quota', () => {
  const loading = ref(false)
  const accountsLoading = ref(false)
  const lastUpdated = ref<string | null>(null)
  const accounts = ref<ManagedAccount[]>([])

  const quotaData = ref<Record<string, QuotaItem>>({
    antigravity: {
      id: 'antigravity',
      name: 'Google Antigravity',
      tier: 'Pro / Ultra 优先配额',
      usedPercentage: 35,
      remainingPercentage: 65,
      status: 'healthy',
      resetIntervalHours: 5,
      secondsRemaining: 12450,
      nextResetTime: '04:30:00',
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
      secondsRemaining: 13200,
      nextResetTime: '04:30:00',
      models: [
        { name: 'gpt-4o-codex', limit: '500 请求 / 5小时', used: '42%' },
        { name: 'o3-mini-reasoning', limit: '200 请求 / 5小时', used: '18%' }
      ]
    },
    claude: {
      id: 'claude',
      name: 'Claude 3.7 Sonnet',
      tier: 'Max Tokens 配额',
      usedPercentage: 15,
      remainingPercentage: 85,
      status: 'healthy',
      resetIntervalHours: 5,
      secondsRemaining: 9800,
      nextResetTime: '04:30:00'
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek-V3 / R1',
      tier: 'API 无限制模式',
      usedPercentage: 8,
      remainingPercentage: 92,
      status: 'healthy',
      resetIntervalHours: 24,
      secondsRemaining: 43200,
      nextResetTime: '23:59:59'
    }
  })

  // 定时器引用，用于实时递减额度重置倒计时
  let timer: any = null

  const startCountdown = () => {
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      Object.keys(quotaData.value).forEach((key) => {
        if (quotaData.value[key].secondsRemaining > 0) {
          quotaData.value[key].secondsRemaining -= 1
        }
      })
      accounts.value.forEach((acc) => {
        if (acc.quota && acc.quota.secondsRemaining > 0) {
          acc.quota.secondsRemaining -= 1
        }
      })
    }, 1000)
  }

  const fetchQuota = async () => {
    loading.value = true
    try {
      const res = await http.get('/quota').catch(() => null)
      if (res && res.data) {
        quotaData.value = res.data
        lastUpdated.value = new Date().toLocaleTimeString()
      } else {
        lastUpdated.value = new Date().toLocaleTimeString()
      }
    } finally {
      loading.value = false
    }
  }

  // 获取所有托管账号
  const fetchAccounts = async () => {
    accountsLoading.value = true
    try {
      const res = await http.get('/accounts').catch(() => null)
      if (res && res.data) {
        accounts.value = res.data
      }
    } finally {
      accountsLoading.value = false
    }
  }

  // 添加 Antigravity 账号
  const addAntigravityAccount = async (payload: {
    email: string
    name?: string
    refreshToken: string
    projectId?: string
  }) => {
    const res = await http.post('/accounts/antigravity', payload)
    if (res && res.success) {
      await fetchAccounts()
      await fetchQuota()
      return res.data
    } else {
      throw new Error(res?.error || '添加 Antigravity 账号失败')
    }
  }

  // 添加 Codex 账号
  const addCodexAccount = async (payload: {
    email: string
    name?: string
    authType?: 'oauth' | 'api_key'
    accessToken?: string
    apiKey?: string
    planType?: string
  }) => {
    const res = await http.post('/accounts/codex', payload)
    if (res && res.success) {
      await fetchAccounts()
      await fetchQuota()
      return res.data
    } else {
      throw new Error(res?.error || '添加 Codex 账号失败')
    }
  }

  // 刷新特定账号配额
  const refreshAccountQuota = async (id: string) => {
    const res = await http.post(`/accounts/${id}/refresh`)
    if (res && res.success) {
      await fetchAccounts()
      return res.data
    } else {
      throw new Error(res?.error || '刷新配额失败')
    }
  }

  // 删除指定账号
  const deleteAccount = async (id: string) => {
    const res = await http.delete(`/accounts/${id}`)
    if (res && res.success) {
      await fetchAccounts()
      return true
    } else {
      throw new Error(res?.error || '删除账号失败')
    }
  }

  return {
    quotaData,
    accounts,
    loading,
    accountsLoading,
    lastUpdated,
    fetchQuota,
    fetchAccounts,
    addAntigravityAccount,
    addCodexAccount,
    refreshAccountQuota,
    deleteAccount,
    startCountdown
  }
})
