<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  Clock
} from '@lucide/vue'

const keyQuotaStore = useKeyQuotaStore()

// 模态框与提交状态控制
const isModalVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)

// 增加资源 modal 页签模式
const modalTab = ref<'token-plane' | 'api-key'>('token-plane')

const providerOptions = [
  { label: 'Google Antigravity (托管 Token)', value: 'google-antigravity' },
  { label: 'OpenAI Codex (托管 Token)', value: 'openai-codex' },
  { label: 'OpenAI Compatible (通用 API)', value: 'openai-compatible' },
  { label: 'Google AI Studio', value: 'google-aistudio' },
  { label: 'Anthropic Claude', value: 'anthropic' },
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
  model: '',
  email: ''
})

// 选择 Provider 变化时自动填充默认 Base URL 与默认模型 (不设置默认名称)
const handleProviderChange = (val: any) => {
  if (!val) return
  if (val === 'google-antigravity') {
    modalTab.value = 'token-plane'
    formData.value.baseUrl = 'https://daily-cloudcode-pa.googleapis.com'
    formData.value.model = 'Gemini 3.6 Flash / Pro'
  } else if (val === 'openai-codex') {
    modalTab.value = 'token-plane'
    formData.value.baseUrl = 'https://chatgpt.com/backend-api'
    formData.value.model = 'gpt-4o-codex'
  } else if (val === 'google-aistudio') {
    modalTab.value = 'api-key'
    formData.value.baseUrl = 'https://generativelanguage.googleapis.com'
    formData.value.model = 'gemini-2.5-flash'
  } else if (val === 'openai-compatible') {
    modalTab.value = 'api-key'
    formData.value.baseUrl = 'https://api.openai.com'
    formData.value.model = 'gpt-4o'
  } else if (val === 'anthropic') {
    modalTab.value = 'api-key'
    formData.value.baseUrl = 'https://api.anthropic.com'
    formData.value.model = 'claude-3-7-sonnet-20250219'
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

// 倒计时格式化 HH:MM:SS (空值时返回空字符串，不设置默认值)
const formatCountdown = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 掩码脱敏 API Key / Token 显示
const maskKey = (key?: string) => {
  if (!key) return ''
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

const formRef = ref()

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  isSubmitting.value = false
  modalTab.value = 'token-plane'
  formData.value = {
    name: '',
    type: 'token-plane',
    provider: '' as any,
    baseUrl: '',
    apiKey: '',
    refreshToken: '',
    accessToken: '',
    model: '',
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
    model: item.model || '',
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
      await keyQuotaStore.updateKey(editingId.value, formData.value as any)
      message.success('更新 API 资源成功')
    } else {
      await keyQuotaStore.addKey(formData.value as any)
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
          新建 API 资源
        </a-button>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="keyQuotaStore.loading" class="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
      <a-spin tip="正在加载 API 资源与配额数据..." />
    </div>

    <!-- 暂无数据空状态 -->
    <div v-else-if="keyQuotaStore.keys.length === 0" class="py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm p-8 text-center">
      <a-empty description="暂无配置记录">
        <a-button type="primary" @click="openAddModal" class="!mt-3 !bg-indigo-600 hover:!bg-indigo-500">
          新建 API 资源
        </a-button>
      </a-empty>
    </div>

    <!-- 资源列表 Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a-card
        v-for="item in keyQuotaStore.keys"
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
                <p v-if="item.email" class="text-xs font-mono text-slate-400 mt-0.5">
                  {{ item.email }}
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

          <!-- 配额进度条 (真实拉取到数据时展示) -->
          <div v-if="item.tokenPlaneQuota" class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span v-if="formatCountdown(item.tokenPlaneQuota.secondsRemaining)" class="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-indigo-500" />
                重置倒计时:
                <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {{ formatCountdown(item.tokenPlaneQuota.secondsRemaining) }}
                </span>
              </span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200 ml-auto">
                剩余 {{ item.tokenPlaneQuota.remainingPercentage }}%
              </span>
            </div>
            <a-progress
              :percent="item.tokenPlaneQuota.remainingPercentage"
              :show-info="false"
              :stroke-color="item.provider === 'google-antigravity' ? '#6366f1' : '#10b981'"
              size="small"
            />
          </div>

          <!-- 未同步 / 探针未测试提示 -->
          <div v-else class="mt-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>尚未获取上游配额数据</span>
          </div>

          <!-- 绑定模型细分 -->
          <div v-if="item.tokenPlaneQuota?.models && item.tokenPlaneQuota.models.length > 0" class="mt-3 space-y-1.5 text-xs">
            <div
              v-for="m in item.tokenPlaneQuota.models"
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
                <div v-if="item.apiKey" class="flex items-center gap-2 mt-0.5">
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
            <div v-if="item.model" class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1">
                <Cpu class="w-3.5 h-3.5 text-indigo-500" />
                绑定模型
              </span>
              <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-700/60">
                {{ item.model }}
              </span>
            </div>

            <div v-if="item.baseUrl" class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1">
                <Globe class="w-3.5 h-3.5 text-sky-500" />
                Endpoint
              </span>
              <span class="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[220px]" :title="item.baseUrl">
                {{ item.baseUrl }}
              </span>
            </div>
          </div>

          <!-- 探针指标：仅在存在探针响应时展示 -->
          <div v-if="item.quotaInfo" class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span class="text-[11px] text-slate-400">剩余请求 (RPM)</span>
              <div class="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {{ item.quotaInfo.remainingRequests !== undefined ? item.quotaInfo.remainingRequests : '' }}
              </div>
            </div>
            <div>
              <span class="text-[11px] text-slate-400">剩余 Tokens (TPM)</span>
              <div class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ item.quotaInfo.remainingTokens !== undefined ? `${(item.quotaInfo.remainingTokens / 1000).toFixed(0)}K` : '' }}
              </div>
            </div>
            <div>
              <span class="text-[11px] text-slate-400">探针延迟</span>
              <div class="text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {{ item.quotaInfo.latencyMs !== undefined ? `${item.quotaInfo.latencyMs} ms` : '' }}
              </div>
            </div>
          </div>
        </template>

        <!-- 卡片底部操作栏 -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span v-if="item.lastTestedAt" class="text-[11px] text-slate-400 font-mono">
            上次更新: {{ new Date(item.lastTestedAt).toLocaleTimeString() }}
          </span>
          <span v-else></span>

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

    <!-- 添加 / 编辑 API 资源 Modal 弹窗 -->
    <a-modal
      v-model:open="isModalVisible"
      :title="isEditing ? '编辑 API 资源' : '新建 API 资源'"
      :confirm-loading="isSubmitting"
      @ok="handleSave"
      :ok-text="isEditing ? '保存修改' : '确认提交'"
      cancel-text="取消"
      class="rounded-2xl"
      width="520px"
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

        <!-- 服务提供商 (Provider) 下拉选择框（选择后自动触发填充） -->
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

        <!-- 模型名称 -->
        <a-form-item label="模型名称 (Model)" name="model" required>
          <a-input
            v-model:value="formData.model"
            placeholder="例如: gpt-4o, claude-3-7-sonnet, gemini-2.5-flash"
          />
        </a-form-item>

        <!-- Token Plane 专属: 邮箱、Refresh Token 与 Access Token -->
        <template v-if="modalTab === 'token-plane'">
          <a-form-item label="账号邮箱 (Email)" name="email">
            <a-input
              v-model:value="formData.email"
              placeholder="请输入关联账号邮箱"
            />
          </a-form-item>

          <a-form-item label="Refresh Token (长效刷新令牌)" name="refreshToken" required>
            <a-input-password
              v-model:value="formData.refreshToken"
              placeholder="请输入长效 Refresh Token"
            />
          </a-form-item>

          <a-form-item label="Access Token (短效访问令牌)" name="accessToken">
            <a-input-password
              v-model:value="formData.accessToken"
              placeholder="请输入短效 Access Token (选填)"
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
