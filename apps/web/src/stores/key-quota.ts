import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/utils/http'

export interface QuotaModelItem {
  name: string
  limit?: string
  used: string
}

export interface TokenPlaneQuota {
  usedPercentage: number
  remainingPercentage: number
  status?: 'healthy' | 'warning' | 'exhausted' | 'untested'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  planType?: string
  models?: QuotaModelItem[]
  rawQuotaData?: any // 完整保存并返回上游 API 响应的原始数据 JSON
}

export interface ApiKeyQuotaInfo {
  remainingRequests?: number
  remainingTokens?: number
  limitRequests?: number
  limitTokens?: number
  resetTimeStr?: string
  latencyMs?: number
  statusMessage?: string
}

export interface ApiKeyConfig {
  id: string
  name: string
  type: 'token-plane' | 'api-key'
  provider: 'google-antigravity' | 'openai-codex' | 'openai-compatible' | 'google-aistudio' | 'anthropic' | 'generic'
  baseUrl: string
  apiKey?: string
  refreshToken?: string
  accessToken?: string
  model: string
  status: 'active' | 'error' | 'untested'
  lastTestedAt?: string
  email?: string
  planType?: string

  tokenPlaneQuota?: TokenPlaneQuota
  quotaInfo?: ApiKeyQuotaInfo
}

export const useKeyQuotaStore = defineStore('keyQuota', () => {
  const keys = ref<ApiKeyConfig[]>([])
  const loading = ref(false)
  const checkingId = ref<string | null>(null)
  const checkingAll = ref(false)

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

  const deleteKey = async (id: string) => {
    const res = await http.delete(`/keys/${id}`).catch(() => null)
    if (res && res.success) {
      keys.value = keys.value.filter((k) => k.id !== id)
      return true
    }
    return false
  }

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
