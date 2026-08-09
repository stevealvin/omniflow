import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/utils/http'

export interface QuotaModelItem {
  name: string
  limit: string
  used: string
}

export interface ApiKeyConfig {
  id: string
  name: string
  type: 'token-plane' | 'api-key'
  provider: 'google-antigravity' | 'openai-codex' | 'openai-compatible' | 'google-aistudio' | 'anthropic' | 'generic'
  baseUrl: string
  apiKey: string
  model: string
  status: 'active' | 'error' | 'untested'
  lastTestedAt?: string

  // Token Plane 专属字段
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

  // API Key 专属 Rate-Limit 字段
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

export const useKeyQuotaStore = defineStore('keyQuota', () => {
  const keys = ref<ApiKeyConfig[]>([])
  const loading = ref(false)
  const checkingId = ref<string | null>(null)
  const checkingAll = ref(false)

  // 定时器用于实时递减 Token Plane 的 5h 重置倒计时
  let timer: any = null

  const startCountdown = () => {
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      keys.value.forEach((item) => {
        if (item.type === 'token-plane' && item.tokenPlaneQuota && item.tokenPlaneQuota.secondsRemaining > 0) {
          item.tokenPlaneQuota.secondsRemaining -= 1
        }
      })
    }, 1000)
  }

  // 获取所有 Key 与 Token Plane 账号列表
  const fetchKeys = async () => {
    loading.value = true
    try {
      const res = await http.get('/keys').catch(() => null)
      if (res && res.data) {
        keys.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  // 添加 API Key 或 Token Plane 账号
  const addKey = async (payload: Partial<ApiKeyConfig>) => {
    loading.value = true
    try {
      const res = await http.post('/keys', payload).catch(() => null)
      if (res && res.data) {
        keys.value.unshift(res.data)
        return true
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新配置
  const updateKey = async (id: string, payload: Partial<ApiKeyConfig>) => {
    loading.value = true
    try {
      const res = await http.put(`/keys/${id}`, payload).catch(() => null)
      if (res && res.data) {
        const idx = keys.value.findIndex((k) => k.id === id)
        if (idx !== -1) keys.value[idx] = res.data
        return true
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // 删除 Key 或 Token Plane 账号
  const deleteKey = async (id: string) => {
    const res = await http.delete(`/keys/${id}`).catch(() => null)
    if (res && res.success) {
      keys.value = keys.value.filter((k) => k.id !== id)
      return true
    }
    return false
  }

  // 单个探针/配额刷新测试
  const checkSingleKey = async (id: string) => {
    checkingId.value = id
    try {
      const res = await http.post(`/keys/${id}/check`).catch(() => null)
      if (res && res.data) {
        const idx = keys.value.findIndex((k) => k.id === id)
        if (idx !== -1) keys.value[idx] = res.data
      }
    } finally {
      checkingId.value = null
    }
  }

  // 批量探针/配额检测
  const checkAllKeys = async () => {
    checkingAll.value = true
    try {
      const res = await http.post('/keys/check-all').catch(() => null)
      if (res && res.data) {
        keys.value = res.data
      }
    } finally {
      checkingAll.value = false
    }
  }

  return {
    keys,
    loading,
    checkingId,
    checkingAll,
    fetchKeys,
    addKey,
    updateKey,
    deleteKey,
    checkSingleKey,
    checkAllKeys,
    startCountdown
  }
})
