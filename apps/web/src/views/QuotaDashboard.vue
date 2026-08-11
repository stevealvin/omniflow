<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useQuotaStore, type ApiKeyConfig, type QuotaDetailItem } from '@/stores/quota'
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Key,
  Globe,
  Sparkles,
  Calendar
} from '@lucide/vue'

const quotaStore = useQuotaStore()

// 格式化倒计时秒数
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

// 掩码脱敏显示
const maskKey = (key?: string) => {
  if (!key) return ''
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

// 动态真实数据统计（无任何死数据/假数据）
const metricsSummary = computed(() => {
  const allKeys = quotaStore.keys
  const totalCount = allKeys.length
  const activeCount = allKeys.filter((k) => k.status === 'active').length
  const errorCount = allKeys.filter((k) => k.status === 'error').length

  const latencies = allKeys
    .map((k) => k.quotaInfo?.latencyMs)
    .filter((l): l is number => typeof l === 'number')

  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : undefined

  return [
    {
      title: '已配置 API 资源',
      value: `${totalCount}`,
      unit: '个资源',
      statusText: totalCount > 0 ? '资源充沛' : '暂无资源',
      icon: Key,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
    },
    {
      title: '探针正常资源',
      value: `${activeCount}`,
      unit: '个正常',
      statusText: totalCount > 0 ? `健康率 ${Math.round((activeCount / totalCount) * 100)}%` : '待连通',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
    },
    {
      title: '探针异常/告警',
      value: `${errorCount}`,
      unit: '个异常',
      statusText: errorCount === 0 ? '运行良好' : '需要检查',
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
    },
    {
      title: '平均探针延迟',
      value: avgLatency !== undefined ? `${avgLatency}` : '---',
      unit: 'ms',
      statusText: avgLatency !== undefined ? '响应迅速' : '尚未测试',
      icon: Activity,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60'
    }
  ]
})

// 筛选 Token Plane 托管账号与 API Key 资源
const tokenPlaneKeys = computed(() => quotaStore.keys.filter((k) => k.type === 'token-plane'))
const apiKeyResources = computed(() => quotaStore.keys.filter((k) => k.type === 'api-key'))

onMounted(() => {
  quotaStore.startCountdown()
  quotaStore.fetchKeys()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 副标题栏与顶栏操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
          <Zap class="w-3.5 h-3.5 text-indigo-500" />
          星环流动算力大盘
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          实时大盘全景：真实呈现 Token Plane 算力剩余与 API Key 联通率
        </span>
      </div>

      <div class="flex items-center gap-3">
        <a-button
          type="default"
          :loading="quotaStore.checkingAll"
          @click="quotaStore.checkAllKeys"
          class="inline-flex items-center gap-1.5 font-medium rounded-lg text-xs"
        >
          <template #icon>
            <RefreshCw class="w-3.5 h-3.5" />
          </template>
          一键刷新全盘探针
        </a-button>
      </div>
    </div>

    <!-- 1. 真实数据指标概览卡片组 (4 Grid Metrics Banner) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="item in metricsSummary"
        :key="item.title"
        class="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all duration-200"
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
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {{ item.statusText }}
          </span>
        </div>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="quotaStore.loading" class="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
      <a-spin tip="正在拉取真实算力大盘数据..." />
    </div>

    <!-- 暂无资源数据 -->
    <div v-else-if="quotaStore.keys.length === 0" class="py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
      <a-empty description="大盘暂无 API 资源配置记录">
        <router-link to="/keys">
          <a-button type="primary" class="!mt-3 !bg-indigo-600 hover:!bg-indigo-500 !rounded-xl">
            前往【API 密钥与算力控制台】添加资源
          </a-button>
        </router-link>
      </a-empty>
    </div>

    <template v-else>
      <!-- 2. Token Plane 托管账号核心算力大盘卡片 -->
      <div v-if="tokenPlaneKeys.length > 0" class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap class="w-4 h-4 text-indigo-500" />
          Token Plane 托管账号算力配额
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="item in tokenPlaneKeys"
            :key="item.id"
            class="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-base">
                  {{ item.name }}
                </h4>
                <p v-if="item.email" class="text-xs font-mono text-slate-400 mt-0.5">
                  {{ item.email }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span
                  v-if="item.tokenPlaneQuota?.planType || item.planType"
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border tracking-wider',
                    (item.tokenPlaneQuota?.planType || item.planType)?.includes('ULTRA')
                      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : (item.tokenPlaneQuota?.planType || item.planType)?.includes('PRO')
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700'
                  ]"
                >
                  {{ item.tokenPlaneQuota?.planType || item.planType }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {{ item.provider === 'google-antigravity' ? 'Antigravity' : 'OpenAI Codex' }}
                </span>
              </div>
            </div>

            <!-- 半圆仪表盘 -->
            <div v-if="item.tokenPlaneQuota" class="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 flex items-center gap-5">
              <div class="shrink-0 relative w-[100px] h-[100px] flex items-center justify-center">
                <a-progress
                  type="dashboard"
                  :percent="item.tokenPlaneQuota.remainingPercentage"
                  :size="100"
                  :stroke-width="9"
                  :stroke-color="item.provider === 'google-antigravity' ? { '0%': '#818cf8', '100%': '#4f46e5' } : { '0%': '#34d399', '100%': '#059669' }"
                  :show-info="false"
                />
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span class="text-[10px] text-slate-400 font-sans">剩余</span>
                  <span class="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {{ item.tokenPlaneQuota.remainingPercentage }}%
                  </span>
                </div>
              </div>

              <div class="flex-1 space-y-2 text-xs min-w-0">
                <div v-if="formatCountdown(item.tokenPlaneQuota.secondsRemaining)" class="flex justify-between items-center py-1.5 px-3 rounded-xl bg-slate-100/80 dark:bg-zinc-800/60">
                  <span class="text-slate-500 dark:text-slate-400 font-medium">重置倒计时</span>
                  <span class="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
                    {{ formatCountdown(item.tokenPlaneQuota.secondsRemaining) }}
                  </span>
                </div>

                <div v-if="item.tokenPlaneQuota.nextResetTime" class="flex justify-between items-center py-1.5 px-3 rounded-xl bg-slate-100/80 dark:bg-zinc-800/60">
                  <span class="text-slate-500 dark:text-slate-400 font-medium">重置时刻</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {{ item.tokenPlaneQuota.nextResetTime }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 算力池配额明细分组网格 (无顶部分割线纯净排版) -->
            <div v-if="item.tokenPlaneQuota?.details?.length" class="mt-3 space-y-3">
              <div
                v-for="(groupItems, groupName) in groupQuotaDetails(item.tokenPlaneQuota.details)"
                :key="groupName"
                class="space-y-1.5"
              >
                <!-- 分组标题 (无背景) -->
                <div class="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
                  <Sparkles v-if="String(groupName).toLowerCase().includes('gemini')" class="w-3.5 h-3.5 text-indigo-500" />
                  <Zap v-else-if="String(groupName).toLowerCase().includes('claude')" class="w-3.5 h-3.5 text-amber-500" />
                  <Globe v-else class="w-3.5 h-3.5 text-sky-500" />
                  {{ groupName }}
                </div>

                <!-- 该分组下的算力桶列表 (纯净无背景 + 极简进度条) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 py-0.5">
                  <div
                    v-for="detail in groupItems"
                    :key="detail.name"
                    class="flex items-center justify-between text-xs gap-2 py-1 px-1 rounded-md"
                  >
                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="flex items-center justify-between gap-1">
                        <span class="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                          {{ detail.name }}
                        </span>
                        <span class="font-black font-mono text-indigo-600 dark:text-indigo-400 text-[11px] shrink-0">
                          {{ detail.remainingPercentage }}%
                        </span>
                      </div>
                      <!-- 极简 4px 动态进度条 -->
                      <div class="w-full bg-slate-200/60 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="detail.remainingPercentage > 50 ? 'bg-emerald-500' : detail.remainingPercentage > 15 ? 'bg-amber-500' : 'bg-rose-500'"
                          :style="{ width: `${detail.remainingPercentage}%` }"
                        ></div>
                      </div>
                    </div>

                    <span v-if="detail.secondsRemaining > 0" class="text-[10px] text-slate-400 font-mono shrink-0 pl-1">
                      {{ formatCountdown(detail.secondsRemaining) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="!item.tokenPlaneQuota" class="p-3 text-xs text-amber-600 bg-amber-50/50 rounded-xl border border-amber-200/50 flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>暂未获取上游配额数据</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. API Key 通用密钥连通状态列表 -->
      <div v-if="apiKeyResources.length > 0" class="space-y-3 pt-2">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key class="w-4 h-4 text-emerald-500" />
          API Key 通用密钥探针状态
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in apiKeyResources"
            :key="item.id"
            class="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">{{ item.name }}</h4>
                <p v-if="item.apiKey" class="text-xs font-mono text-slate-400">{{ maskKey(item.apiKey) }}</p>
              </div>

              <a-tag :color="item.status === 'active' ? 'success' : item.status === 'error' ? 'error' : 'default'">
                {{ item.status === 'active' ? '正常' : item.status === 'error' ? '异常' : '未测' }}
              </a-tag>
            </div>

            <div v-if="item.quotaInfo" class="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <span class="text-[10px] text-slate-400">剩余 RPM</span>
                <p class="font-mono font-bold text-indigo-600">{{ item.quotaInfo.remainingRequests ?? '---' }}</p>
              </div>
              <div>
                <span class="text-[10px] text-slate-400">剩余 TPM</span>
                <p class="font-mono font-bold text-emerald-600">
                  {{ item.quotaInfo.remainingTokens ? `${(item.quotaInfo.remainingTokens / 1000).toFixed(0)}K` : '---' }}
                </p>
              </div>
              <div>
                <span class="text-[10px] text-slate-400">探针延迟</span>
                <p class="font-mono font-bold text-sky-600">
                  {{ item.quotaInfo.latencyMs ? `${item.quotaInfo.latencyMs}ms` : '---' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
