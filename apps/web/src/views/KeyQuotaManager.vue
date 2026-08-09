<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useKeyQuotaStore, type ApiKeyConfig } from '@/stores/key-quota'
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
  Cpu,
  Clock,
  Sparkles,
  Search,
  UserCheck,
  Shield,
  Layers
} from '@lucide/vue'

const keyQuotaStore = useKeyQuotaStore()

const searchQuery = ref('')
const selectedCategory = ref<'all' | 'token-plane' | 'api-key'>('all')
const selectedProvider = ref<string>('all')

// 模态框控制
const isModalVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// 增加资源 modal 页签模式
const modalTab = ref<'token-plane' | 'api-key'>('token-plane')

const formData = ref({
  name: '',
  type: 'token-plane' as 'token-plane' | 'api-key',
  provider: 'google-antigravity' as ApiKeyConfig['provider'],
  baseUrl: 'https://daily-cloudcode-pa.googleapis.com',
  apiKey: '',
  model: 'Gemini 3.6 Flash / Pro',
  email: '',
  planType: 'Pro / Ultra 优先配额'
})

// 平台预设控制 helper
const applyPreset = (type: 'antigravity' | 'codex' | 'google' | 'openai' | 'deepseek' | 'anthropic') => {
  if (type === 'antigravity') {
    modalTab.value = 'token-plane'
    formData.value.name = 'Google Antigravity 工作账号'
    formData.value.type = 'token-plane'
    formData.value.provider = 'google-antigravity'
    formData.value.baseUrl = 'https://daily-cloudcode-pa.googleapis.com'
    formData.value.model = 'Gemini 3.6 Flash / Pro'
    formData.value.planType = 'Pro / Ultra 优先配额'
  } else if (type === 'codex') {
    modalTab.value = 'token-plane'
    formData.value.name = 'OpenAI Codex Pro 账号'
    formData.value.type = 'token-plane'
    formData.value.provider = 'openai-codex'
    formData.value.baseUrl = 'https://chatgpt.com/backend-api'
    formData.value.model = 'gpt-4o-codex / o3-mini'
    formData.value.planType = '开发者 Pro 版'
  } else if (type === 'google') {
    modalTab.value = 'api-key'
    formData.value.name = 'Google AI Studio Key'
    formData.value.type = 'api-key'
    formData.value.provider = 'google-aistudio'
    formData.value.baseUrl = 'https://generativelanguage.googleapis.com'
    formData.value.model = 'gemini-2.5-flash'
  } else if (type === 'openai') {
    modalTab.value = 'api-key'
    formData.value.name = 'OpenAI 官方通用 Key'
    formData.value.type = 'api-key'
    formData.value.provider = 'openai-compatible'
    formData.value.baseUrl = 'https://api.openai.com'
    formData.value.model = 'gpt-4o'
  } else if (type === 'deepseek') {
    modalTab.value = 'api-key'
    formData.value.name = 'DeepSeek 官方 API Key'
    formData.value.type = 'api-key'
    formData.value.provider = 'openai-compatible'
    formData.value.baseUrl = 'https://api.deepseek.com'
    formData.value.model = 'deepseek-chat'
  } else if (type === 'anthropic') {
    modalTab.value = 'api-key'
    formData.value.name = 'Anthropic Claude Key'
    formData.value.type = 'api-key'
    formData.value.provider = 'anthropic'
    formData.value.baseUrl = 'https://api.anthropic.com'
    formData.value.model = 'claude-3-7-sonnet-20250219'
  }
}

// 倒计时格式化 HH:MM:SS
const formatCountdown = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds <= 0) return '00:00:00 (重置中)'
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 掩码脱敏 API Key 显示
const maskKey = (key: string) => {
  if (!key) return ''
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

// 过滤后的列表
const filteredKeys = computed(() => {
  return keyQuotaStore.keys.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.baseUrl.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesCategory =
      selectedCategory.value === 'all' || item.type === selectedCategory.value

    const matchesProvider =
      selectedProvider.value === 'all' || item.provider === selectedProvider.value

    return matchesSearch && matchesCategory && matchesProvider
  })
})

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  applyPreset('antigravity')
  isModalVisible.value = true
}

const openEditModal = (item: ApiKeyConfig) => {
  isEditing.value = true
  editingId.value = item.id
  modalTab.value = item.type || 'api-key'
  formData.value = {
    name: item.name,
    type: item.type || 'api-key',
    provider: item.provider,
    baseUrl: item.baseUrl,
    apiKey: item.apiKey,
    model: item.model,
    email: item.email || '',
    planType: item.planType || ''
  }
  isModalVisible.value = true
}

const handleSave = async () => {
  if (!formData.value.name) {
    message.warning('请填写名称')
    return
  }

  formData.value.type = modalTab.value

  if (isEditing.value && editingId.value) {
    await keyQuotaStore.updateKey(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    await keyQuotaStore.addKey(formData.value)
    message.success('添加成功')
  }
  isModalVisible.value = false
}

const handleDelete = async (id: string) => {
  await keyQuotaStore.deleteKey(id)
  message.success('删除成功')
}

onMounted(() => {
  keyQuotaStore.fetchKeys()
  keyQuotaStore.startCountdown()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 副标题栏与顶栏操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
          <Key class="w-3.5 h-3.5 text-indigo-500" />
          通用 API 与 Token 算力中枢
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          统筹管理 Token Plane (Google Antigravity & OpenAI Codex 托管账号) 与 API Key (通用 API 密钥) 额度
        </span>
      </div>

      <div class="flex items-center gap-3">
        <a-button
          type="default"
          :loading="keyQuotaStore.checkingAll"
          @click="keyQuotaStore.checkAllKeys"
          class="inline-flex items-center gap-1.5 font-medium rounded-lg text-xs"
        >
          <template #icon>
            <RefreshCw class="w-3.5 h-3.5" />
          </template>
          一键探测/刷新所有额度
        </a-button>

        <a-button
          type="primary"
          @click="openAddModal"
          class="inline-flex items-center gap-1.5 font-medium rounded-lg text-xs !bg-indigo-600 hover:!bg-indigo-500"
        >
          <template #icon>
            <Plus class="w-4 h-4" />
          </template>
          添加资源 (Token / Key)
        </a-button>
      </div>
    </div>

    <!-- 顶部分类 Segment & 搜索工具栏 -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
      <!-- 资源类型分类切换 (Token Plane vs API Key) -->
      <div class="flex items-center p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl w-full md:w-auto">
        <button
          type="button"
          @click="selectedCategory = 'all'"
          :class="[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
            selectedCategory === 'all'
              ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          全部资源 ({{ keyQuotaStore.keys.length }})
        </button>

        <button
          type="button"
          @click="selectedCategory = 'token-plane'"
          :class="[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
            selectedCategory === 'token-plane'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Zap class="w-3.5 h-3.5 text-indigo-500" />
          Token Plane 托管账号
        </button>

        <button
          type="button"
          @click="selectedCategory = 'api-key'"
          :class="[
            'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
            selectedCategory === 'api-key'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Key class="w-3.5 h-3.5 text-emerald-500" />
          API Key 通用密钥
        </button>
      </div>

      <!-- 搜索与筛选 -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索名称、邮箱、模型或 Endpoint..."
            class="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          v-model="selectedProvider"
          class="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 focus:outline-none text-slate-700 dark:text-slate-200"
        >
          <option value="all">全部平台</option>
          <option value="google-antigravity">Google Antigravity</option>
          <option value="openai-codex">OpenAI Codex</option>
          <option value="google-aistudio">Google AI Studio</option>
          <option value="openai-compatible">OpenAI 通用/中转</option>
          <option value="anthropic">Anthropic Claude</option>
        </select>
      </div>
    </div>

    <!-- 资源列表 Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a-card
        v-for="item in filteredKeys"
        :key="item.id"
        variant="borderless"
        class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <!-- A. Token Plane 类型卡片渲染 (Antigravity & Codex) -->
        <template v-if="item.type === 'token-plane'">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs',
                  item.provider === 'google-antigravity' ? 'bg-indigo-600' : 'bg-emerald-600'
                ]"
              >
                {{ item.provider === 'google-antigravity' ? 'AG' : 'CX' }}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {{ item.name }}
                </h3>
                <p class="text-xs font-mono text-slate-400 mt-0.5">
                  {{ item.email || 'token-plane@omniflow.dev' }}
                </p>
              </div>
            </div>

            <a-tag color="purple" class="!rounded-md font-medium !px-2">
              <span class="flex items-center gap-1 text-xs">
                <Zap class="w-3.5 h-3.5 text-indigo-400" />
                Token Plane
              </span>
            </a-tag>
          </div>

          <!-- 配额进度条 -->
          <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-indigo-500" />
                重置倒计时:
                <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {{ formatCountdown(item.tokenPlaneQuota?.secondsRemaining) }}
                </span>
              </span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">
                剩余 {{ item.tokenPlaneQuota?.remainingPercentage ?? 60 }}%
              </span>
            </div>
            <a-progress
              :percent="item.tokenPlaneQuota?.remainingPercentage ?? 60"
              :show-info="false"
              :stroke-color="item.provider === 'google-antigravity' ? '#6366f1' : '#10b981'"
              size="small"
            />
          </div>

          <!-- 绑定模型细分 -->
          <div class="mt-3 space-y-1.5 text-xs">
            <div
              v-for="m in item.tokenPlaneQuota?.models || []"
              :key="m.name"
              class="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-100/70 dark:bg-zinc-800/70 text-slate-600 dark:text-slate-300"
            >
              <span>{{ m.name }}</span>
              <span class="font-mono text-slate-400">{{ m.used }} 已用</span>
            </div>
          </div>
        </template>

        <!-- B. API Key 类型卡片渲染 (OpenAI / DeepSeek / Google / Anthropic) -->
        <template v-else>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Key class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {{ item.name }}
                </h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Lock class="w-3 h-3" />
                    {{ maskKey(item.apiKey) }}
                  </span>
                </div>
              </div>
            </div>

            <a-tag :color="item.status === 'active' ? 'success' : item.status === 'error' ? 'error' : 'default'" class="!rounded-md font-medium !px-2">
              <span class="flex items-center gap-1 text-xs">
                <CheckCircle2 v-if="item.status === 'active'" class="w-3.5 h-3.5 text-emerald-500" />
                <AlertCircle v-else-if="item.status === 'error'" class="w-3.5 h-3.5 text-rose-500" />
                {{ item.status === 'active' ? '探针正常' : item.status === 'error' ? '探针异常' : '未检测' }}
              </span>
            </a-tag>
          </div>

          <!-- 详细信息：模型与 Endpoint -->
          <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1">
                <Cpu class="w-3.5 h-3.5 text-indigo-500" />
                目标模型
              </span>
              <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-700/60">
                {{ item.model }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1">
                <Globe class="w-3.5 h-3.5 text-sky-500" />
                Endpoint
              </span>
              <span class="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[220px]" :title="item.baseUrl">
                {{ item.baseUrl }}
              </span>
            </div>
          </div>

          <!-- 探针指标：RPM / TPM / Latency -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span class="text-[11px] text-slate-400">剩余请求 (RPM)</span>
              <div class="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {{ item.quotaInfo?.remainingRequests ?? '---' }}
              </div>
            </div>
            <div>
              <span class="text-[11px] text-slate-400">剩余 Tokens (TPM)</span>
              <div class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ item.quotaInfo?.remainingTokens ? `${(item.quotaInfo.remainingTokens / 1000).toFixed(0)}K` : '---' }}
              </div>
            </div>
            <div>
              <span class="text-[11px] text-slate-400">探针延迟</span>
              <div class="text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {{ item.quotaInfo?.latencyMs ? `${item.quotaInfo.latencyMs} ms` : '---' }}
              </div>
            </div>
          </div>
        </template>

        <!-- 卡片底部操作栏 -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-mono">
            {{ item.lastTestedAt ? `上次更新: ${new Date(item.lastTestedAt).toLocaleTimeString()}` : '未同步' }}
          </span>

          <div class="flex items-center gap-2">
            <a-button
              type="default"
              size="small"
              :loading="keyQuotaStore.checkingId === item.id"
              @click="keyQuotaStore.checkSingleKey(item.id)"
              class="!text-xs !rounded-lg"
            >
              <template #icon>
                <RefreshCw class="w-3 h-3" />
              </template>
              {{ item.type === 'token-plane' ? '刷新配额' : '检测探针' }}
            </a-button>

            <a-button
              type="text"
              size="small"
              @click="openEditModal(item)"
              class="!text-xs !rounded-lg text-slate-600 dark:text-slate-300"
            >
              <template #icon>
                <Edit3 class="w-3 h-3" />
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
                class="!text-xs !rounded-lg"
              >
                <template #icon>
                  <Trash2 class="w-3 h-3" />
                </template>
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 添加 / 编辑资源 Modal 弹窗 -->
    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? '编辑 API 资源配置' : '添加通用 API 资源'"
      @ok="handleSave"
      ok-text="保存资源配置"
      cancel-text="取消"
      class="rounded-2xl"
    >
      <div class="space-y-4 pt-2">
        <!-- 资源大类 Tab: Token Plane vs API Key -->
        <div v-if="!isEditing" class="p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl grid grid-cols-2 text-center text-xs font-semibold">
          <button
            type="button"
            @click="applyPreset('antigravity')"
            :class="['py-2 rounded-lg transition-all', modalTab === 'token-plane' ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm' : 'text-slate-500']"
          >
            Token Plane (托管账号)
          </button>
          <button
            type="button"
            @click="applyPreset('openai')"
            :class="['py-2 rounded-lg transition-all', modalTab === 'api-key' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm' : 'text-slate-500']"
          >
            API Key (通用密钥)
          </button>
        </div>

        <!-- 快捷预设按钮组 -->
        <div>
          <label class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">快捷预设填充:</label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              @click="applyPreset('antigravity')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
            >
              Google Antigravity
            </button>
            <button
              type="button"
              @click="applyPreset('codex')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            >
              OpenAI Codex
            </button>
            <button
              type="button"
              @click="applyPreset('google')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
            >
              Google AI Studio Key
            </button>
            <button
              type="button"
              @click="applyPreset('openai')"
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200"
            >
              OpenAI 官方 Key
            </button>
          </div>
        </div>

        <!-- 资源名称 -->
        <div>
          <label class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">资源标识名称 *</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="例如: Google Antigravity 主账号 或 OpenAI API Key"
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <!-- Token Plane 专属: 邮箱 -->
        <div v-if="modalTab === 'token-plane'">
          <label class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">账号邮箱 (Email)</label>
          <input
            v-model="formData.email"
            type="text"
            placeholder="例如: user@antigravity.google"
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <!-- API Key / Token 值 -->
        <div>
          <label class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
            {{ modalTab === 'token-plane' ? 'Refresh Token / Access Token *' : 'API Key 密钥值 *' }}
          </label>
          <input
            v-model="formData.apiKey"
            type="password"
            placeholder="输入 Token 令牌或 sk-*** 密钥"
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
          />
        </div>

        <!-- Base URL -->
        <div>
          <label class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">接口 Base URL *</label>
          <input
            v-model="formData.baseUrl"
            type="text"
            placeholder="https://..."
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
          />
        </div>

        <!-- Model -->
        <div>
          <label class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">目标模型 / 绑定模型</label>
          <input
            v-model="formData.model"
            type="text"
            placeholder="gemini-2.5-flash, gpt-4o 等"
            class="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>
