<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuotaStore, type ApiKeyConfig, type QuotaDetailItem } from '@/stores/quota'
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
} from '@lucide/vue'

const quotaStore = useQuotaStore()

// 模态框与提交状态控制
const isModalVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)

// 增加资源 modal 页签模式
const modalTab = ref<'token-plane' | 'api-key'>('token-plane')

const formRef = ref()

const providerOptions = [
  { label: 'Google Antigravity (Gemini Code Assist / PA)', value: 'google-antigravity' },
  { label: 'OpenAI Codex / Wham (ChatGPT Provider)', value: 'openai-codex' },
  { label: 'OpenAI Compatible (通用模型接口)', value: 'openai-compatible' },
  { label: 'Google AI Studio', value: 'google-aistudio' },
  { label: 'Generic (其他通用)', value: 'generic' }
]

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

// 选择 Provider 变化时自动填充默认 Base URL
const handleProviderChange = (val: any) => {
  if (!val) return
  if (val === 'google-antigravity') {
    modalTab.value = 'token-plane'
    formData.value.baseUrl = 'https://daily-cloudcode-pa.googleapis.com'
  } else if (val === 'openai-codex') {
    modalTab.value = 'token-plane'
    formData.value.baseUrl = 'https://chatgpt.com/backend-api'
  } else if (val === 'google-aistudio') {
    modalTab.value = 'api-key'
    formData.value.baseUrl = 'https://generativelanguage.googleapis.com'
  } else if (val === 'openai-compatible') {
    modalTab.value = 'api-key'
    formData.value.baseUrl = 'https://api.openai.com'
  } else if (val === 'generic') {
    modalTab.value = 'api-key'
    if (!formData.value.baseUrl) formData.value.baseUrl = 'https://'
  }
}

// 切换大类 Tab 时处理
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

// 倒计时格式化为 "X日 X时 X分 X秒"
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

// 掩码脱敏 API Key / Token 显示
const maskKey = (key?: string) => {
  if (!key) return ''
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

// 将 details 列表按 providerGroup 分组 (如 Gemini 算力组、Claude 算力组)
const groupQuotaDetails = (details?: QuotaDetailItem[]) => {
  if (!details || details.length === 0) return {}
  const groups: Record<string, QuotaDetailItem[]> = {}
  for (const item of details) {
    const rawGroup = item.providerGroup || '算力池'
    if (!groups[rawGroup]) {
      groups[rawGroup] = []
    }
    groups[rawGroup].push(item)
  }
  return groups
}

// 按照提供商获取 Badge 样式分类
const getProviderBadgeStyle = (provider: string) => {
  switch (provider) {
    case 'google-antigravity':
      return 'bg-indigo-600 text-white'
    case 'openai-codex':
      return 'bg-emerald-600 text-white'
    case 'google-aistudio':
      return 'bg-sky-600 text-white'
    case 'openai-compatible':
      return 'bg-teal-600 text-white'
    default:
      return 'bg-slate-700 text-white'
  }
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
  } catch (err) {
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
    <!-- 顶栏与控制台 Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Key class="w-3.5 h-3.5 text-indigo-500" />
            API 密钥与算力控制台
          </span>
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
            全盘管控 Token Plane 托管账号与 API Key 算力配额
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 md:hidden">
          全盘管控 Token Plane 托管账号与 API Key 算力配额
        </p>
      </div>

      <div class="flex items-center gap-3">
        <a-button
          type="default"
          :loading="quotaStore.checkingAll"
          @click="quotaStore.checkAllKeys"
          class="inline-flex items-center gap-1.5 font-medium rounded-xl text-xs !h-9"
        >
          <template #icon>
            <RefreshCw class="w-3.5 h-3.5 text-indigo-500" />
          </template>
          一键探测/刷新所有额度
        </a-button>

        <a-button
          type="primary"
          @click="openAddModal"
          class="inline-flex items-center gap-1.5 font-semibold rounded-xl text-xs !h-9 !bg-indigo-600 hover:!bg-indigo-500"
        >
          <template #icon>
            <Plus class="w-4 h-4" />
          </template>
          新建 API 资源
        </a-button>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="quotaStore.loading" class="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
      <a-spin tip="正在加载 API 资源与配额数据..." />
    </div>

    <!-- 暂无数据空状态 -->
    <div v-else-if="quotaStore.keys.length === 0" class="py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
      <a-empty description="暂无配置记录">
        <a-button type="primary" @click="openAddModal" class="!mt-3 !bg-indigo-600 hover:!bg-indigo-500 !rounded-xl">
          新建 API 资源
        </a-button>
      </a-empty>
    </div>

    <!-- 扁平卡片 Grid (无阴影 + 首页半圆仪表盘 dashboard 样式 + planType + 具体重置时间) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="item in quotaStore.keys"
        :key="item.id"
        class="rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between p-4 space-y-3"
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
                  v-if="item.tokenPlaneQuota?.planType || item.planType"
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-black tracking-wide border uppercase shadow-2xs',
                    (item.tokenPlaneQuota?.planType || item.planType)?.toLowerCase().includes('ultra')
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/60'
                      : (item.tokenPlaneQuota?.planType || item.planType)?.toLowerCase().includes('pro')
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300/60 dark:border-indigo-700/60'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700'
                  ]"
                >
                  {{ item.tokenPlaneQuota?.planType || item.planType }}
                </span>

                <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1.5">
                  <Zap class="w-3.5 h-3.5 text-indigo-500" />
                  Token Plane
                </span>
              </div>
            </div>

            <!-- 配额主体区：如果有 details 则左右各 50% 分栏；如果没有 details 则居中显示 -->
            <div
              v-if="item.tokenPlaneQuota"
              :class="[
                'flex items-center gap-4 min-w-0 py-1',
                item.tokenPlaneQuota.details?.length ? 'justify-between' : 'justify-center'
              ]"
            >
              <!-- 左列：圆形仪表盘 + 倒计时 + 重置时刻 -->
              <div
                :class="[
                  'flex flex-col items-center justify-center gap-1.5',
                  item.tokenPlaneQuota.details?.length ? 'w-1/2 flex-1 min-w-0' : 'w-full'
                ]"
              >
                <!-- 圆形仪表盘 -->
                <div class="relative w-[88px] h-[88px] flex items-center justify-center shrink-0">
                  <a-progress
                    type="dashboard"
                    :percent="item.tokenPlaneQuota.remainingPercentage"
                    :size="88"
                    :stroke-width="9"
                    :stroke-color="item.provider === 'google-antigravity' ? { '0%': '#818cf8', '100%': '#4f46e5' } : { '0%': '#34d399', '100%': '#059669' }"
                    :show-info="false"
                  />
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span class="text-[9px] text-slate-400 font-medium leading-none mb-0.5">剩余</span>
                    <span class="text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white leading-none">
                      {{ item.tokenPlaneQuota.remainingPercentage }}%
                    </span>
                  </div>
                </div>

                <!-- 倒计时 + 重置时刻（仪表盘下方） -->
                <div class="space-y-0.5 text-center w-full">
                  <div v-if="formatCountdown(item.tokenPlaneQuota.secondsRemaining)" class="flex items-center justify-center gap-1 text-xs">
                    <Clock class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ formatCountdown(item.tokenPlaneQuota.secondsRemaining) }}</span>
                  </div>
                  <div v-if="item.tokenPlaneQuota.nextResetTime" class="flex items-center justify-center gap-1 text-xs">
                    <Calendar class="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span class="font-mono text-slate-500 dark:text-slate-400">{{ item.tokenPlaneQuota.nextResetTime }}</span>
                  </div>
                </div>
              </div>

              <!-- 竖向分隔线 (仅当有 details 时) -->
              <div
                v-if="item.tokenPlaneQuota.details?.length"
                class="shrink-0 w-px bg-slate-200 dark:bg-zinc-700/80 self-stretch my-1"
              />

              <!-- 右列：details 分组 (占 50% 空间) -->
              <div
                v-if="item.tokenPlaneQuota.details?.length"
                class="w-1/2 flex-1 min-w-0 space-y-2"
              >
                <div
                  v-for="(groupItems, groupName) in groupQuotaDetails(item.tokenPlaneQuota.details)"
                  :key="groupName"
                  class="space-y-1"
                >
                  <!-- 分组标题 -->
                  <div class="flex items-center gap-1 text-xs font-extrabold text-slate-600 dark:text-slate-300 tracking-wide">
                    <Sparkles v-if="String(groupName).toLowerCase().includes('gemini')" class="w-3.5 h-3.5 text-indigo-400" />
                    <Zap v-else-if="String(groupName).toLowerCase().includes('claude')" class="w-3.5 h-3.5 text-amber-400" />
                    <Globe v-else class="w-3.5 h-3.5 text-sky-400" />
                    {{ groupName }}
                  </div>

                  <!-- 该分组下的算力桶列表 -->
                  <div class="space-y-1">
                    <div
                      v-for="detail in groupItems"
                      :key="detail.name"
                      class="space-y-0.5"
                    >
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {{ detail.name }}
                          <span v-if="detail.secondsRemaining > 0" class="font-normal font-mono text-slate-400 dark:text-slate-500">（{{ formatCountdown(detail.secondsRemaining) }}）</span>
                        </span>
                        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">{{ detail.remainingPercentage }}%</span>
                      </div>
                      <div class="w-full h-1 rounded-full bg-slate-200/60 dark:bg-zinc-800 overflow-hidden">
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

            <!-- 未同步 / 探针未测试提示 -->
            <div v-else-if="!item.tokenPlaneQuota" class="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>尚未获取上游配额数据，请点击下方【刷新配额】按钮进行测算</span>
            </div>
          </div>
        </template>

        <!-- B. API Key 类型卡片渲染 (OpenAI / DeepSeek / Google / Generic) -->
        <template v-else>
          <div class="space-y-4">
            <!-- 卡片头部: Key Icon + 名称 + 校验 Tag -->
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

            <!-- 详细配置: Endpoint -->
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

            <!-- 探针性能与 Rate-Limit 响应面板 -->
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

        <!-- 卡片底栏: 更新时间与操作按钮组 -->
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

    <!-- 添加 / 编辑 API 资源 Modal 弹窗 -->
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
        <!-- 资源大类 Tab: Token Plane vs API Key -->
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

        <!-- 服务提供商 (Provider) 下拉选择框 -->
        <a-form-item label="服务提供商 (Provider)" name="provider" required>
          <a-select
            v-model:value="formData.provider"
            :options="providerOptions"
            @change="handleProviderChange"
            placeholder="请选择服务提供商"
            class="!w-full"
          />
        </a-form-item>

        <!-- 资源名称 -->
        <a-form-item label="资源名称" name="name" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入资源名称"
          />
        </a-form-item>



        <!-- Token Plane 专属: 邮箱、Refresh Token 与 Access Token -->
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

        <!-- API Key 专属: API Key 密钥 -->
        <template v-else>
          <a-form-item label="API Key 密钥" name="apiKey" required>
            <a-input-password
              v-model:value="formData.apiKey"
              placeholder="请输入 sk-*** 密钥"
            />
          </a-form-item>
        </template>

        <!-- Base URL -->
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
