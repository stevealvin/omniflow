<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuotaStore, type ApiKeyConfig, type QuotaDetailItem, type TokenPlaneQuota } from '@/stores/quota'
import { message } from 'antdv-next'
import {
  Key,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Zap,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  Clock,
  Sparkles,
  Calendar,
  Search,
  Server,
  ShieldCheck
} from '@lucide/vue'

const quotaStore = useQuotaStore()

// 搜索与过滤控制
const searchQuery = ref('')
const filterType = ref<'all' | 'token-plane' | 'api-key'>('all')
const filterProvider = ref<string>('all')

// 统计维度快照
const stats = computed(() => {
  const total = quotaStore.keys.length
  const tokenPlaneCount = quotaStore.keys.filter((k) => k.type === 'token-plane').length
  const apiKeyCount = quotaStore.keys.filter((k) => k.type === 'api-key').length
  const healthyCount = quotaStore.keys.filter((k) => k.status === 'active').length
  return { total, tokenPlaneCount, apiKeyCount, healthyCount }
})

// 过滤筛选后的 Key 列表
const filteredKeys = computed(() => {
  return quotaStore.keys.filter((item) => {
    if (filterType.value !== 'all' && item.type !== filterType.value) {
      return false
    }
    if (filterProvider.value !== 'all' && item.provider !== filterProvider.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchName = item.name.toLowerCase().includes(q)
      const matchEmail = (item.email || '').toLowerCase().includes(q)
      const matchProvider = (item.provider || '').toLowerCase().includes(q)
      const matchBaseUrl = (item.baseUrl || '').toLowerCase().includes(q)
      return matchName || matchEmail || matchProvider || matchBaseUrl
    }
    return true
  })
})

// 模态框与提交状态控制
const isModalVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const modalTab = ref<'token-plane' | 'api-key'>('token-plane')
const formRef = ref()

const providerOptions = [
  { label: 'Google Antigravity (Gemini Code Assist / PA)', value: 'google-antigravity' },
  { label: 'OpenAI Codex / Wham (ChatGPT Provider)', value: 'openai-codex' },
  { label: 'OpenAI Compatible (通用模型接口)', value: 'openai-compatible' },
  { label: 'Google AI Studio', value: 'google-aistudio' },
  { label: 'Generic (其他通用)', value: 'generic' }
]

const PROVIDER_DEFAULTS: Record<string, { type: 'token-plane' | 'api-key'; baseUrl: string }> = {
  'google-antigravity': { type: 'token-plane', baseUrl: 'https://daily-cloudcode-pa.googleapis.com' },
  'openai-codex': { type: 'token-plane', baseUrl: 'https://chatgpt.com/backend-api' },
  'google-aistudio': { type: 'api-key', baseUrl: 'https://generativelanguage.googleapis.com' },
  'openai-compatible': { type: 'api-key', baseUrl: 'https://api.openai.com' },
  'generic': { type: 'api-key', baseUrl: 'https://' }
}

const formData = ref({
  name: '',
  type: 'token-plane' as 'token-plane' | 'api-key',
  provider: '' as ApiKeyConfig['provider'] | '',
  baseUrl: '',
  apiKey: '',
  refreshToken: '',
  accessToken: '',
  email: ''
})

// 提取卡片有效倒计时秒数（结合 nextResetTime 时间字符串与静态秒数动态计算）
const getCardSecondsRemaining = (quota?: TokenPlaneQuota) => {
  if (!quota) return 0
  const dynamicSecs = getRemainingSecondsFromResetTime(quota.nextResetTime, quota.secondsRemaining)
  if (dynamicSecs > 0) return dynamicSecs

  if (quota.details?.length) {
    const validSecs = quota.details
      .map((d) => getRemainingSecondsFromResetTime(d.nextResetTime, d.secondsRemaining))
      .filter((s) => s > 0)
    if (validSecs.length) return Math.min(...validSecs)
  }
  return 0
}

// 选择 Provider 变化时自动填充默认配置
const handleProviderChange = (val: any) => {
  if (!val || !PROVIDER_DEFAULTS[val]) return
  const def = PROVIDER_DEFAULTS[val]
  modalTab.value = def.type
  if (!formData.value.baseUrl || val !== 'generic') {
    formData.value.baseUrl = def.baseUrl
  }
}

// 切换 Tab 按钮
const handleTabChange = (type: 'token-plane' | 'api-key') => {
  modalTab.value = type
  if (type === 'token-plane') {
    if (formData.value.provider !== 'google-antigravity' && formData.value.provider !== 'openai-codex') {
      formData.value.provider = 'google-antigravity'
      handleProviderChange('google-antigravity')
    }
  } else {
    if (formData.value.provider === 'google-antigravity' || formData.value.provider === 'openai-codex') {
      formData.value.provider = 'openai-compatible'
      handleProviderChange('openai-compatible')
    }
  }
}

// 倒计时格式化
const formatCountdown = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const days = Math.floor(totalSeconds / 86400)
  const hrs = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}日`)
  if (hrs > 0 || days > 0) parts.push(`${hrs}时`)
  if (mins > 0 || hrs > 0 || days > 0) parts.push(`${mins}分`)
  parts.push(`${secs}秒`)

  return parts.join(' ')
}

import dayjs from 'dayjs'

/**
 * 从 nextResetTime 时间字符串 (如 "2026-08-19 08:49:03") 动态计算剩余秒数
 */
const getRemainingSecondsFromResetTime = (nextResetTime?: string, fallbackSeconds?: number): number => {
  if (!nextResetTime || nextResetTime === '无需重置') {
    return fallbackSeconds && fallbackSeconds > 0 ? fallbackSeconds : 0
  }
  const diffSec = dayjs(nextResetTime).diff(dayjs(), 'second')
  return isNaN(diffSec) ? (fallbackSeconds && fallbackSeconds > 0 ? fallbackSeconds : 0) : Math.max(0, diffSec)
}

// 掩码脱敏显示
const maskKey = (key?: string) => {
  if (!key) return ''
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

// 按组归类配额细节
const groupQuotaDetails = (details?: QuotaDetailItem[]) => {
  if (!details || details.length === 0) return {}
  const groups: Record<string, QuotaDetailItem[]> = {}
  for (const item of details) {
    const rawGroup = item.providerGroup || '算力池'
    if (!groups[rawGroup]) groups[rawGroup] = []
    groups[rawGroup].push(item)
  }
  return groups
}

// 获取订阅类型 Badge 样式
const getPlanTypeBadgeStyle = (planType?: string) => {
  const lower = (planType || '').toLowerCase()
  if (lower.includes('ultra')) {
    return 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/60'
  }
  if (lower.includes('pro')) {
    return 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300/60 dark:border-indigo-700/60'
  }
  return 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700'
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  isSubmitting.value = false
  modalTab.value = 'token-plane'
  formData.value = {
    name: '',
    type: 'token-plane',
    provider: 'google-antigravity',
    baseUrl: 'https://daily-cloudcode-pa.googleapis.com',
    apiKey: '',
    refreshToken: '',
    accessToken: '',
    email: ''
  }
  isModalVisible.value = true
  formRef.value?.clearValidate()
}

const openEditModal = (item: ApiKeyConfig) => {
  isEditing.value = true
  editingId.value = item.id
  isSubmitting.value = false
  modalTab.value = item.type || 'api-key'
  formData.value = {
    name: item.name,
    type: item.type || 'api-key',
    provider: item.provider,
    baseUrl: item.baseUrl,
    apiKey: item.apiKey || '',
    refreshToken: item.refreshToken || '',
    accessToken: item.accessToken || '',
    email: item.email || ''
  }
  isModalVisible.value = true
  formRef.value?.clearValidate()
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  isSubmitting.value = true
  try {
    formData.value.type = modalTab.value
    if (isEditing.value && editingId.value) {
      await quotaStore.updateKey(editingId.value, formData.value as any)
      message.success('更新 API 资源成功')
    } else {
      await quotaStore.addKey(formData.value as any)
      message.success('添加 API 资源成功')
    }
    isModalVisible.value = false
  } catch (err: any) {
    message.error('提交失败: ' + (err.message || '未知网络异常'))
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id: string) => {
  await quotaStore.deleteKey(id)
  message.success('删除成功')
}

onMounted(() => {
  quotaStore.fetchKeys()
  quotaStore.startCountdown()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 1. 顶栏控制台 Banner (Apple Translucent Chrome Material + Specular Top Edge) -->
    <div class="rounded-3xl border border-slate-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border-t border-t-white/80 dark:border-t-white/10 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- 标题与状态提示 (Optical Sizing & Negative Tracking) -->
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
              <Key class="w-3.5 h-3.5 text-indigo-500" />
              AI 算力控制中心
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
              全盘管控 Token Plane 托管账号与 API Key 算力配额
            </span>
          </div>
          <h1 class="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            算力节点与配额管理
          </h1>
        </div>

        <!-- 顶部主操作按钮 (Apple Instant Press Feedback) -->
        <div class="flex items-center gap-2.5 shrink-0">
          <a-button
            type="default"
            :loading="quotaStore.checkingAll"
            @click="quotaStore.checkAllKeys"
            class="inline-flex items-center gap-1.5 font-semibold rounded-2xl text-xs !h-10 !px-4 hover:!border-indigo-400 dark:hover:!border-indigo-500 active:scale-[0.98] transition-all duration-100 ease-out"
          >
            <template #icon>
              <RefreshCw class="w-4 h-4 text-indigo-500" />
            </template>
            一键全盘探测/刷新
          </a-button>

          <a-button
            type="primary"
            @click="openAddModal"
            class="inline-flex items-center gap-1.5 font-bold rounded-2xl text-xs !h-10 !px-4 !bg-gradient-to-r !from-indigo-600 !to-indigo-500 hover:!from-indigo-500 hover:!to-indigo-400 shadow-md shadow-indigo-500/20 border-0 active:scale-[0.98] transition-all duration-100 ease-out"
          >
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
            新建 API 资源
          </a-button>
        </div>
      </div>

      <!-- 2. 数据快照统计指标行 (Apple Translucent Materials & Depth) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between transition-all duration-200 hover:border-indigo-300/50">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">配置资源总数</span>
            <div class="text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white">{{ stats.total }}</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
            <Server class="w-4 h-4" />
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between transition-all duration-200 hover:border-purple-300/50">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">Token Plane 托管</span>
            <div class="text-lg font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">{{ stats.tokenPlaneCount }}</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-500 shrink-0 shadow-2xs">
            <Zap class="w-4 h-4" />
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between transition-all duration-200 hover:border-emerald-300/50">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">API Key 密钥</span>
            <div class="text-lg font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">{{ stats.apiKeyCount }}</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-500 shrink-0 shadow-2xs">
            <Key class="w-4 h-4" />
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between transition-all duration-200 hover:border-sky-300/50">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">探针正常状态</span>
            <div class="text-lg font-black font-mono tracking-tight text-sky-600 dark:text-sky-400">{{ stats.healthyCount }}</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-sky-500 shrink-0 shadow-2xs">
            <ShieldCheck class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- 3. 搜索与分栏筛选工具栏 (Apple iOS Segmented Control) -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        <!-- Segmented Tab Picker -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="p-1 rounded-2xl bg-slate-200/50 dark:bg-zinc-800/60 backdrop-blur-md border border-black/5 dark:border-white/5 flex items-center gap-1 text-xs">
            <button
              @click="filterType = 'all'"
              :class="[
                'px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-[0.97]',
                filterType === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              全部资源 ({{ stats.total }})
            </button>
            <button
              @click="filterType = 'token-plane'"
              :class="[
                'px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-[0.97]',
                filterType === 'token-plane'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              Token Plane ({{ stats.tokenPlaneCount }})
            </button>
            <button
              @click="filterType = 'api-key'"
              :class="[
                'px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-[0.97]',
                filterType === 'api-key'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              API Key ({{ stats.apiKeyCount }})
            </button>
          </div>
        </div>

        <!-- 右侧搜索框与 Provider 下拉过滤 (Apple Glass Inputs) -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-64">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索名称 / 邮箱 / Provider..."
              class="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-700/50 focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-900 text-slate-800 dark:text-slate-200 outline-none transition-all"
            />
          </div>

          <select
            v-model="filterProvider"
            class="px-3 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-700/50 text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-indigo-400"
          >
            <option value="all">全部 Provider</option>
            <option value="google-antigravity">Google Antigravity</option>
            <option value="openai-codex">OpenAI Codex</option>
            <option value="openai-compatible">OpenAI Compatible</option>
            <option value="google-aistudio">Google AI Studio</option>
            <option value="generic">Generic 通用</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="quotaStore.loading" class="py-20 text-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-3xl border border-slate-200/70 dark:border-zinc-800/70 shadow-sm">
      <a-spin description="正在加载 API 资源与配额数据..." />
    </div>

    <!-- 暂无数据空状态 -->
    <div v-else-if="filteredKeys.length === 0" class="py-20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-3xl border border-slate-200/70 dark:border-zinc-800/70 p-8 text-center shadow-sm">
      <a-empty :description="searchQuery || filterType !== 'all' || filterProvider !== 'all' ? '未找到符合条件的 API 资源记录' : '暂无配置记录'">
        <a-button type="primary" @click="openAddModal" class="!mt-3 !bg-indigo-600 hover:!bg-indigo-500 !rounded-xl active:scale-[0.98]">
          新建 API 资源
        </a-button>
      </a-empty>
    </div>

    <!-- 扁平卡片 Grid (保留卡片内部元素 100% 不变，升级 Apple Depth 边框与 Ambient Glow 阴影) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="item in filteredKeys"
        :key="item.id"
        class="rounded-3xl border border-slate-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(79,70,229,0.12)] dark:hover:shadow-[0_16px_40px_rgba(79,70,229,0.08)] hover:border-indigo-300/80 dark:hover:border-indigo-700/80 hover:-translate-y-1 transition-all duration-300 ease-out backdrop-blur-md overflow-hidden flex flex-col justify-between p-4 space-y-3"
      >
        <!-- A. Token Plane 类型卡片渲染 (Antigravity & Codex) -->
        <template v-if="item.type === 'token-plane'">
          <div class="space-y-4">
            <!-- 卡片头部: Provider Icon + 名称 + 邮箱 + 顶栏 Badges -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <div
                  :class="[
                    'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0',
                    item.provider === 'google-antigravity'
                      ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-indigo-500/25'
                      : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/25'
                  ]"
                >
                  {{ item.provider === 'google-antigravity' ? 'AG' : 'CX' }}
                </div>
                <div class="min-w-0">
                  <h3 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-base tracking-tight truncate">
                    {{ item.name }}
                  </h3>
                  <p v-if="item.email" class="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                    {{ item.email }}
                  </p>
                </div>
              </div>

              <!-- 右上角 Badge 组 -->
              <div class="flex items-center gap-2 shrink-0">
                <span
                  v-if="item.tokenQuota?.planType"
                  :class="['px-3 py-1 rounded-full text-xs font-black tracking-wide border uppercase shadow-2xs', getPlanTypeBadgeStyle(item.tokenQuota.planType)]"
                >
                  {{ item.tokenQuota.planType }}
                </span>

                <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1.5">
                  <Zap class="w-3.5 h-3.5 text-indigo-500" />
                  Token Plane
                </span>
              </div>
            </div>

            <!-- 配额主体区：左列（圆形仪表+文字） / 右列（details 伸展占满） -->
            <div
              v-if="item.tokenQuota"
              :class="[
                'flex items-center gap-5 min-w-0 py-1',
                item.tokenQuota.details?.length ? 'justify-between' : 'justify-center'
              ]"
            >
              <!-- 左列：圆形仪表盘 + 倒计时 + 重置时刻 -->
              <div
                :class="[
                  'flex flex-col items-center justify-center gap-2 shrink-0',
                  item.tokenQuota.details?.length ? 'w-56' : 'w-full'
                ]"
              >
                <!-- 圆形仪表盘 -->
                <div class="relative w-[110px] h-[110px] flex items-center justify-center shrink-0">
                  <a-progress
                    type="dashboard"
                    :percent="item.tokenQuota.remainingPercentage"
                    :size="110"
                    :stroke-width="10"
                    :stroke-color="item.provider === 'google-antigravity' ? { '0%': '#818cf8', '100%': '#4f46e5' } : { '0%': '#34d399', '100%': '#059669' }"
                    :show-info="false"
                  />
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span class="text-[10px] text-slate-400 font-medium leading-none mb-1">剩余</span>
                    <span class="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white leading-none">
                      {{ item.tokenQuota.remainingPercentage }}%
                    </span>
                  </div>
                </div>

                <!-- 倒计时 + 重置时刻（仪表盘下方） -->
                <div class="space-y-1 text-center w-full">
                  <div v-if="getCardSecondsRemaining(item.tokenQuota) > 0" class="flex items-center justify-center gap-1 text-xs">
                    <Clock class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ formatCountdown(getCardSecondsRemaining(item.tokenQuota)) }}</span>
                  </div>
                  <div v-if="item.tokenQuota.nextResetTime" class="flex items-center justify-center gap-1 text-xs">
                    <Calendar class="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span class="font-mono text-slate-500 dark:text-slate-400">{{ item.tokenQuota.nextResetTime }}</span>
                  </div>
                </div>
              </div>

              <!-- 竖向分隔线 -->
              <div
                v-if="item.tokenQuota.details?.length"
                class="shrink-0 w-px bg-slate-200 dark:bg-zinc-700/80 self-stretch my-1"
              />

              <!-- 右列：details 分组 -->
              <div
                v-if="item.tokenQuota.details?.length"
                class="flex-1 min-w-0 space-y-3 pl-1"
              >
                <div
                  v-for="(groupItems, groupName) in groupQuotaDetails(item.tokenQuota.details)"
                  :key="groupName"
                  class="space-y-1.5"
                >
                  <!-- 分组标题 -->
                  <div class="flex items-center gap-1 text-xs font-extrabold text-slate-600 dark:text-slate-300 tracking-wide">
                    <Sparkles v-if="String(groupName).toLowerCase().includes('gemini')" class="w-3.5 h-3.5 text-indigo-400" />
                    <Zap v-else-if="String(groupName).toLowerCase().includes('claude')" class="w-3.5 h-3.5 text-amber-400" />
                    <Globe v-else class="w-3.5 h-3.5 text-sky-400" />
                    {{ groupName }}
                  </div>

                  <!-- 算力桶列表 -->
                  <div class="space-y-1.5">
                    <div
                      v-for="detail in groupItems"
                      :key="detail.name"
                      class="space-y-1"
                    >
                      <div class="flex items-center justify-between text-xs gap-2">
                        <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {{ detail.name }}
                          <span v-if="getRemainingSecondsFromResetTime(detail.nextResetTime, detail.secondsRemaining) > 0" class="font-normal font-mono text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">（{{ formatCountdown(getRemainingSecondsFromResetTime(detail.nextResetTime, detail.secondsRemaining)) }}）</span>
                        </span>
                        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{{ detail.remainingPercentage }}%</span>
                      </div>
                      <div class="w-full h-1.5 rounded-full bg-slate-200/60 dark:bg-zinc-800 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="detail.remainingPercentage > 50 ? 'bg-emerald-500' : detail.remainingPercentage > 15 ? 'bg-amber-500' : 'bg-rose-500'"
                          :style="{ width: `${detail.remainingPercentage}%` }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 未同步提示 -->
            <div v-else-if="!item.tokenQuota" class="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>尚未获取上游配额数据，请点击下方【刷新配额】按钮进行测算</span>
            </div>
          </div>
        </template>

        <!-- B. API Key 类型卡片渲染 -->
        <template v-else>
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Key class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                    {{ item.name }}
                  </h3>
                  <div v-if="item.apiKey" class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Lock class="w-3 h-3" />
                      {{ maskKey(item.apiKey) }}
                    </span>
                  </div>
                </div>
              </div>

              <a-tag :color="item.status === 'active' ? 'success' : item.status === 'error' ? 'error' : 'default'" class="!rounded-full font-semibold !px-3 !py-0.5 shrink-0">
                <span class="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 v-if="item.status === 'active'" class="w-3.5 h-3.5 text-emerald-500" />
                  <AlertCircle v-else-if="item.status === 'error'" class="w-3.5 h-3.5 text-rose-500" />
                  {{ item.status === 'active' ? '探针正常' : item.status === 'error' ? '探针异常' : '未检测' }}
                </span>
              </a-tag>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
              <div v-if="item.baseUrl" class="flex items-center justify-between">
                <span class="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Globe class="w-3.5 h-3.5 text-sky-500" />
                  Endpoint
                </span>
                <span class="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[220px]" :title="item.baseUrl">
                  {{ item.baseUrl }}
                </span>
              </div>
            </div>

            <div v-if="item.quotaInfo" class="pt-2 grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/60">
                <span class="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">剩余 RPM</span>
                <div class="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {{ item.quotaInfo.remainingRequests !== undefined ? item.quotaInfo.remainingRequests : '---' }}
                </div>
              </div>

              <div class="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/60">
                <span class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">剩余 TPM</span>
                <div class="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {{ item.quotaInfo.remainingTokens !== undefined ? `${(item.quotaInfo.remainingTokens / 1000).toFixed(0)}K` : '---' }}
                </div>
              </div>

              <div class="p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100/60 dark:border-sky-900/60">
                <span class="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">探针延迟</span>
                <div class="text-sm font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                  {{ item.quotaInfo.latencyMs !== undefined ? `${item.quotaInfo.latencyMs}ms` : '---' }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 卡片底栏 -->
        <div class="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span v-if="item.lastTestedAt" class="text-[11px] text-slate-400 font-mono">
            更新时间: {{ new Date(item.lastTestedAt).toLocaleTimeString() }}
          </span>
          <span v-else></span>

          <div class="flex items-center gap-2">
            <a-button
              type="default"
              size="small"
              :loading="quotaStore.isKeyChecking(item.id)"
              @click="quotaStore.checkSingleKey(item.id)"
              class="!text-xs !rounded-xl !h-7 !px-3 font-medium"
            >
              <template #icon>
                <RefreshCw class="w-3 h-3 text-indigo-500" />
              </template>
              {{ item.type === 'token-plane' ? '刷新配额' : '检测探针' }}
            </a-button>

            <a-button
              type="text"
              size="small"
              @click="openEditModal(item)"
              class="!text-xs !rounded-xl !h-7 !w-7 !p-0 text-slate-500 hover:text-indigo-600 dark:text-slate-400"
              title="编辑配置"
            >
              <template #icon>
                <Edit3 class="w-3.5 h-3.5" />
              </template>
            </a-button>

            <a-popconfirm
              title="确定要删除该配置记录吗？"
              ok-text="确认删除"
              cancel-text="取消"
              @confirm="handleDelete(item.id)"
            >
              <a-button
                type="text"
                danger
                size="small"
                class="!text-xs !rounded-xl !h-7 !w-7 !p-0"
                title="删除配置"
              >
                <template #icon>
                  <Trash2 class="w-3.5 h-3.5" />
                </template>
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 弹窗 -->
    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? '编辑 API 资源' : '新建 API 资源'"
      :confirm-loading="isSubmitting"
      @ok="handleSave"
      :ok-text="isEditing ? '保存修改' : '确认提交'"
      cancel-text="取消"
      class="rounded-3xl"
      width="540px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        layout="vertical"
        class="!pt-2"
      >
        <a-form-item v-if="!isEditing" label="资源大类">
          <a-radio-group v-model:value="modalTab" button-style="solid" class="!w-full !flex">
            <a-radio-button value="token-plane" class="!flex-1 !text-center" @click="handleTabChange('token-plane')">
              Token Plane (托管账号)
            </a-radio-button>
            <a-radio-button value="api-key" class="!flex-1 !text-center" @click="handleTabChange('api-key')">
              API Key (通用密钥)
            </a-radio-button>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="服务提供商 (Provider)" name="provider" required>
          <a-select
            v-model:value="formData.provider"
            :options="providerOptions"
            @change="handleProviderChange"
            placeholder="请选择服务提供商"
            class="!w-full"
          />
        </a-form-item>

        <a-form-item label="资源名称" name="name" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入资源名称"
          />
        </a-form-item>

        <template v-if="modalTab === 'token-plane'">
          <a-form-item label="账号邮箱 (Email)" name="email">
            <a-input
              v-model:value="formData.email"
              placeholder="请输入关联账号邮箱 (支持授权自动填充)"
            />
          </a-form-item>

          <a-form-item label="Refresh Token (长效刷新令牌)" name="refreshToken" required>
            <a-input-password
              v-model:value="formData.refreshToken"
              placeholder="请输入长效 Token 或点击上方一键授权/粘贴 Code 解析"
            />
          </a-form-item>

          <a-form-item label="Access Token (短效访问令牌)" name="accessToken">
            <a-input-password
              v-model:value="formData.accessToken"
              placeholder="请输入短效 Access Token (选填，支持自动获取)"
            />
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="API Key 密钥" name="apiKey" required>
            <a-input-password
              v-model:value="formData.apiKey"
              placeholder="请输入 sk-*** 密钥"
            />
          </a-form-item>
        </template>

        <a-form-item label="接口 Base URL" name="baseUrl" required>
          <a-input
            v-model:value="formData.baseUrl"
            placeholder="https://..."
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
