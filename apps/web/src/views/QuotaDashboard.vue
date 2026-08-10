<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useQuotaStore } from '@/stores/quota'
import { message } from 'antdv-next'
import {
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
  Activity,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Layers,
  Radio,
  Plus,
  Trash2,
  UserCheck,
  Key
} from '@lucide/vue'

const quotaStore = useQuotaStore()

// 弹窗状态
const isAddModalVisible = ref(false)
const activeTab = ref<'antigravity' | 'codex'>('antigravity')
const submitting = ref(false)
const refreshingAccountId = ref<string | null>(null)

// 表单状态
const antigravityForm = reactive({
  email: '',
  name: '',
  refreshToken: '',
  projectId: ''
})

const codexForm = reactive({
  email: '',
  name: '',
  authType: 'oauth' as 'oauth' | 'api_key',
  accessToken: '',
  apiKey: '',
  planType: ''
})

// 格式化倒计时秒数 HH:MM:SS
const formatCountdown = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 指标概览
const metricsSummary = [
  {
    title: '今日 Token 消耗',
    value: '1.42M',
    unit: 'Tokens',
    change: '+12.4%',
    isPositive: true,
    icon: BarChart3,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
  },
  {
    title: 'API 综合成功率',
    value: '99.96%',
    unit: '可用性',
    change: '+0.02%',
    isPositive: true,
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
  },
  {
    title: '平均请求延迟',
    value: '24',
    unit: 'ms',
    change: '-4ms',
    isPositive: true,
    icon: Activity,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60'
  },
  {
    title: '5h 重置倒计时',
    value: '04:28:15',
    unit: '刷新中',
    change: '自动刷新',
    isPositive: true,
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
  }
]


// 日志事件流
const recentEvents = [
  { time: '23:38:12', title: 'Google Antigravity 算力额度自动轮询计算完成', type: 'info' },
  { time: '23:35:00', title: 'Redmi Watch 6 完成抬腕算力数据 1 次同步', type: 'success' },
  { time: '23:20:45', title: 'OpenAI Codex 接口连接状态良好，平均延迟 18ms', type: 'info' },
  { time: '23:00:00', title: '5小时 AI 算力循环刷新窗口计数递减中', type: 'warning' }
]

// 打开添加账号 Modal
const handleOpenAddModal = () => {
  isAddModalVisible.value = true
}

// 提交表单添加账号
const handleSubmitAddAccount = async () => {
  submitting.value = true
  try {
    if (activeTab.value === 'antigravity') {
      if (!antigravityForm.email || !antigravityForm.refreshToken) {
        message.warning('请填写完整的邮箱与 Refresh Token')
        return
      }
      await quotaStore.addAntigravityAccount({
        email: antigravityForm.email,
        name: antigravityForm.name,
        refreshToken: antigravityForm.refreshToken,
        projectId: antigravityForm.projectId
      })
      message.success('Google Antigravity 账号添加成功！')
      antigravityForm.email = ''
      antigravityForm.name = ''
      antigravityForm.refreshToken = ''
      antigravityForm.projectId = ''
    } else {
      if (!codexForm.email) {
        message.warning('请填写账号邮箱')
        return
      }
      await quotaStore.addCodexAccount({
        email: codexForm.email,
        name: codexForm.name,
        authType: codexForm.authType,
        accessToken: codexForm.accessToken,
        apiKey: codexForm.apiKey,
        planType: codexForm.planType
      })
      message.success('OpenAI Codex 账号添加成功！')
      codexForm.email = ''
      codexForm.name = ''
      codexForm.accessToken = ''
      codexForm.apiKey = ''
    }
    isAddModalVisible.value = false
  } catch (error: any) {
    message.error(error.message || '添加账号失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 刷新指定账号配额
const handleRefreshAccountQuota = async (id: string) => {
  refreshingAccountId.value = id
  try {
    await quotaStore.refreshAccountQuota(id)
    message.success('已刷新最新配额信息')
  } catch (error: any) {
    message.error(error.message || '刷新失败')
  } finally {
    refreshingAccountId.value = null
  }
}

// 删除指定账号
const handleDeleteAccount = async (id: string) => {
  try {
    await quotaStore.deleteAccount(id)
    message.success('账号已成功删除')
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

onMounted(() => {
  quotaStore.startCountdown()
  quotaStore.fetchQuota()
  quotaStore.fetchAccounts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 大盘顶部控制与副标题栏 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
          <Radio class="w-3.5 h-3.5 animate-pulse text-indigo-500" />
          全盘实时监控中
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          星环流动 (OmniFlow) 算力分布与 AI 额度全局数据大盘
        </span>
      </div>

      <div class="flex items-center gap-3">

        <a-button
          type="default"
          :loading="quotaStore.loading"
          @click="quotaStore.fetchQuota"
          class="inline-flex items-center gap-1.5 font-medium rounded-lg text-xs"
        >
          <template #icon>
            <RefreshCw class="w-3.5 h-3.5" />
          </template>
          同步大盘数据
        </a-button>
      </div>
    </div>

    <!-- 1. 核心指标数据卡片组 (4 Grid Metrics Banner) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <a-card
        v-for="item in metricsSummary"
        :key="item.title"
        variant="borderless"
        class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ item.title }}</span>
          <div :class="['w-8 h-8 rounded-xl flex items-center justify-center', item.color]">
            <component :is="item.icon" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <div>
            <span class="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{{ item.value }}</span>
            <span class="text-xs text-slate-400 ml-1 font-sans">{{ item.unit }}</span>
          </div>
          <span class="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp class="w-3 h-3" />
            {{ item.change }}
          </span>
        </div>
      </a-card>
    </div>

    <!-- 2. AI 算力与额度核心双卡片 (Google Antigravity & OpenAI Codex) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Google Antigravity 卡片 -->
      <a-card
        variant="borderless"
        class="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-zinc-900"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Zap class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ quotaStore.quotaData.antigravity?.name || 'Google Antigravity' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ quotaStore.quotaData.antigravity?.tier || 'Pro / Ultra 优先配额' }}
              </p>
            </div>
          </div>
          <a-tag color="success" class="!rounded-md font-medium !px-2">
            <span class="flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" />
              配额充沛
            </span>
          </a-tag>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-center gap-6">
          <!-- 环形进度仪表盘 -->
          <div class="flex-shrink-0 relative w-[120px] h-[120px] flex items-center justify-center">
            <a-progress
              type="dashboard"
              :percent="quotaStore.quotaData.antigravity?.remainingPercentage || 65"
              :stroke-color="{ '0%': '#818cf8', '100%': '#4f46e5' }"
              :size="120"
              :stroke-width="9"
              :show-info="false"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-[11px] text-slate-400">剩余配额</span>
              <span class="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {{ quotaStore.quotaData.antigravity?.remainingPercentage || 65 }}%
              </span>
            </div>
          </div>

          <!-- 配额统计数据与重置时间 -->
          <div class="flex-1 space-y-3 w-full">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
              <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-indigo-500" />
                  额度重置倒计时
                </span>
                <span class="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {{ quotaStore.quotaData.antigravity?.nextResetTime || '04:30:00' }} 刷新
                </span>
              </div>
              <div class="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                {{ formatCountdown(quotaStore.quotaData.antigravity?.secondsRemaining || 12450) }}
              </div>
            </div>

            <!-- 模型细分占用标签 -->
            <div class="space-y-1.5">
              <div
                v-for="m in quotaStore.quotaData.antigravity?.models || []"
                :key="m.name"
                class="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-100/70 dark:bg-zinc-800/70 text-slate-600 dark:text-slate-300"
              >
                <span>{{ m.name }}</span>
                <span class="font-mono text-slate-500 dark:text-slate-400">{{ m.used }} 已用</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- OpenAI Codex 卡片 -->
      <a-card
        variant="borderless"
        class="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-zinc-900"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ quotaStore.quotaData.codex?.name || 'OpenAI Codex / Copilot' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ quotaStore.quotaData.codex?.tier || '开发者 Pro 版' }}
              </p>
            </div>
          </div>
          <a-tag color="processing" class="!rounded-md font-medium !px-2">
            <span class="flex items-center gap-1">
              <Activity class="w-3.5 h-3.5" />
              运行正常
            </span>
          </a-tag>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-center gap-6">
          <!-- 环形进度仪表盘 -->
          <div class="flex-shrink-0 relative w-[120px] h-[120px] flex items-center justify-center">
            <a-progress
              type="dashboard"
              :percent="quotaStore.quotaData.codex?.remainingPercentage || 58"
              :stroke-color="{ '0%': '#34d399', '100%': '#059669' }"
              :size="120"
              :stroke-width="9"
              :show-info="false"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-[11px] text-slate-400">剩余配额</span>
              <span class="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {{ quotaStore.quotaData.codex?.remainingPercentage || 58 }}%
              </span>
            </div>
          </div>

          <!-- 配额统计数据与重置时间 -->
          <div class="flex-1 space-y-3 w-full">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
              <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-emerald-500" />
                  额度重置倒计时
                </span>
                <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {{ quotaStore.quotaData.codex?.nextResetTime || '04:30:00' }} 刷新
                </span>
              </div>
              <div class="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                {{ formatCountdown(quotaStore.quotaData.codex?.secondsRemaining || 13200) }}
              </div>
            </div>

            <!-- 模型细分占用标签 -->
            <div class="space-y-1.5">
              <div
                v-for="m in quotaStore.quotaData.codex?.models || []"
                :key="m.name"
                class="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-100/70 dark:bg-zinc-800/70 text-slate-600 dark:text-slate-300"
              >
                <span>{{ m.name }}</span>
                <span class="font-mono text-slate-500 dark:text-slate-400">{{ m.used }} 已用</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 3. 已托管的多账号与实时配额列表管理 -->
    <a-card
      variant="borderless"
      class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm"
    >
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div class="flex items-center gap-2">
          <UserCheck class="w-4 h-4 text-indigo-500" />
          <h3 class="font-semibold text-slate-900 dark:text-white">已托管 AI 账号与额度列表</h3>
        </div>
        <span class="text-xs text-slate-400 font-mono">
          共托管 {{ quotaStore.accounts.length }} 个账号
        </span>
      </div>

      <div v-if="quotaStore.accountsLoading" class="py-8 text-center text-xs text-slate-400">
        正在拉取最新账号与配额信息...
      </div>

      <div v-else-if="quotaStore.accounts.length === 0" class="py-8 text-center text-xs text-slate-400">
        暂未添加独立账号，请点击顶部“添加 AI 账号”按钮绑定 Antigravity / Codex 凭据。
      </div>

      <div v-else class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="account in quotaStore.accounts"
          :key="account.id"
          class="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 space-y-3 relative group"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                  account.platform === 'antigravity' ? 'bg-indigo-600' : 'bg-emerald-600'
                ]"
              >
                {{ account.platform === 'antigravity' ? 'AG' : 'CX' }}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                  {{ account.name }}
                </h4>
                <p class="text-xs text-slate-400 font-mono mt-1">
                  {{ account.email }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <a-button
                type="text"
                size="small"
                :loading="refreshingAccountId === account.id"
                @click="handleRefreshAccountQuota(account.id)"
                class="!p-1 text-slate-400 hover:text-indigo-600"
                title="刷新配额"
              >
                <RefreshCw class="w-3.5 h-3.5" />
              </a-button>

              <a-popconfirm
                title="确认删除该账号？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="handleDeleteAccount(account.id)"
              >
                <a-button
                  type="text"
                  danger
                  size="small"
                  class="!p-1 text-slate-400 hover:text-red-600"
                  title="删除账号"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </a-button>
              </a-popconfirm>
            </div>
          </div>

          <!-- 配额进度条 -->
          <div v-if="account.quota" class="space-y-1">
            <div class="flex justify-between text-xs font-mono">
              <span class="text-slate-500">剩余配额</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ account.quota.remainingPercentage }}%
              </span>
            </div>
            <a-progress
              :percent="account.quota.remainingPercentage"
              :show-info="false"
              :stroke-color="account.platform === 'antigravity' ? '#6366f1' : '#10b981'"
              size="small"
            />
          </div>

          <!-- 模型细分占用 -->
          <div v-if="account.quota" class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-zinc-700/50 text-[11px]">
            <div v-if="account.quota.secondsRemaining" class="flex justify-between text-slate-500">
              <span>倒计时:</span>
              <span class="font-mono text-indigo-600 dark:text-indigo-400">
                {{ formatCountdown(account.quota.secondsRemaining) }}
              </span>
            </div>
            <div v-if="account.quota.planType || account.planType" class="flex justify-between text-slate-500">
              <span>模式:</span>
              <span class="font-mono text-slate-700 dark:text-slate-300">
                {{ account.quota.planType || account.planType }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a-card>


    <!-- 5. 大盘底层：动态事件与日志流 -->
    <div class="pt-6">
      <a-card
        variant="borderless"
        class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <h3 class="font-semibold text-slate-900 dark:text-white">星环中枢日志事件流</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">实时推演</span>
        </div>

        <div class="mt-3 divide-y divide-slate-100 dark:divide-zinc-800/60">
          <div
            v-for="(event, idx) in recentEvents"
            :key="idx"
            class="py-2.5 flex items-center justify-between text-xs"
          >
            <div class="flex items-center gap-3">
              <span class="font-mono text-slate-400">{{ event.time }}</span>
              <span class="text-slate-700 dark:text-slate-300">{{ event.title }}</span>
            </div>
            <a-tag :color="event.type === 'success' ? 'success' : event.type === 'warning' ? 'warning' : 'blue'" class="!rounded-md">
              正常
            </a-tag>
          </div>
        </div>
      </a-card>
    </div>

  </div>
</template>
