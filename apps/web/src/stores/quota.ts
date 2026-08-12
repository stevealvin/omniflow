import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { http } from '@/utils/http'

export interface QuotaDetailItem {
  name: string
  providerGroup: string
  remainingPercentage: number
  secondsRemaining: number
  nextResetTime: string
}

export interface TokenPlaneQuota {
  usedPercentage: number
  remainingPercentage: number
  status?: 'healthy' | 'warning' | 'exhausted' | 'untested'
  resetIntervalHours: number
  secondsRemaining: number
  nextResetTime: string
  planType?: string
  details?: QuotaDetailItem[]
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
  provider: 'google-antigravity' | 'openai-codex' | 'openai-compatible' | 'google-aistudio' | 'generic'
  baseUrl: string
  apiKey?: string
  refreshToken?: string
  accessToken?: string
  status: 'active' | 'error' | 'untested'
  lastTestedAt?: string
  email?: string

  tokenQuota?: TokenPlaneQuota
  quotaInfo?: ApiKeyQuotaInfo
  rawQuotaData?: any
}

export const useQuotaStore = defineStore('quota', () => {
  const keys = ref<ApiKeyConfig[]>([])
  const isLoading = ref(false)
  const checkingAll = ref(false)
  const checkingIds = reactive<Record<string, boolean>>({})
  let timer: any = null

  // 兼容别名属性 loading
  const loading = computed(() => isLoading.value)

  // 判断指定 Key 是否正在测试中 (支持多卡片并行并发加载)
  const isKeyChecking = (id: string) => !!checkingIds[id]

  // 启动倒计时计数器
  const startCountdown = () => {
    if (timer) return
    timer = setInterval(() => {
      keys.value.forEach((k) => {
        if (k.tokenQuota && k.tokenQuota.secondsRemaining > 0) {
          k.tokenQuota.secondsRemaining -= 1
        }
        if (k.tokenQuota?.details) {
          k.tokenQuota.details.forEach((d) => {
            if (d.secondsRemaining > 0) d.secondsRemaining -= 1
          })
        }
      })
    }, 1000)
  }

  // 1. 获取所有 API 资源与密钥列表
  const fetchKeys = async () => {
    isLoading.value = true
    try {
      const res = await http.get('/quota')
      if (res && res.data) {
        keys.value = res.data
      }
    } finally {
      isLoading.value = false
    }
  }

  // 2. 刷新测试单个 Key / 资源探针 (支持多卡片并行并发加载)
  const checkSingleKey = async (id: string) => {
    checkingIds[id] = true
    try {
      const res = await http.post(`/quota/${id}/check`)
      if (res && res.data) {
        const idx = keys.value.findIndex((k) => k.id === id)
        if (idx !== -1) {
          keys.value[idx] = res.data
        }
      }
      return res
    } finally {
      delete checkingIds[id]
    }
  }

  // 3. 刷新全盘所有探针
  const checkAllKeys = async () => {
    checkingAll.value = true
    try {
      const res = await http.post('/quota/check-all')
      if (res && res.data) {
        keys.value = res.data
      }
    } finally {
      checkingAll.value = false
    }
  }

  // 4. 添加新 API 资源
  const addKey = async (config: Omit<ApiKeyConfig, 'id' | 'status'>) => {
    const res = await http.post('/quota', config)
    if (res && res.data) {
      keys.value.push(res.data)
    }
    return res
  }

  // 5. 更新 API 资源
  const updateKey = async (id: string, config: Partial<ApiKeyConfig>) => {
    const res = await http.put(`/quota/${id}`, config)
    if (res && res.data) {
      const idx = keys.value.findIndex((k) => k.id === id)
      if (idx !== -1) {
        keys.value[idx] = res.data
      }
    }
    return res
  }

  // 6. 删除 API 资源
  const deleteKey = async (id: string) => {
    const res = await http.delete(`/quota/${id}`)
    keys.value = keys.value.filter((k) => k.id !== id)
    return res
  }

  return {
    keys,
    isLoading,
    loading,
    checkingAll,
    checkingIds,
    isKeyChecking,
    startCountdown,
    fetchKeys,
    checkSingleKey,
    checkAllKeys,
    addKey,
    updateKey,
    deleteKey
  }
})
