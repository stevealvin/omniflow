<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuotaStore, type ApiKeyConfig, type QuotaDetailItem, type TokenPlaneQuota } from '@/stores/quota'
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
  Calendar,
  LayoutGrid,
  Bell,
  Bot,
  ArrowUpRight
} from '@lucide/vue'
import dayjs from 'dayjs'

const router = useRouter()
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

// 提取卡片有效倒计时秒数（结合 nextResetTime 时间字符串与静态秒数动态计算）
const getCardSecondsRemaining = (quota?: TokenPlaneQuota) => {
  if (!quota) return 0
  const dynamicSecs = getRemainingSecondsFromResetTime(quota.nextResetTime, quota.secondsRemaining)
  if (dynamicSecs > 0) return dynamicSecs

  if (quota.details?.length) {
    const validSecs = quota.details
      .map((d: QuotaDetailItem) => getRemainingSecondsFromResetTime(d.nextResetTime, d.secondsRemaining))
      .filter((s: number) => s > 0)
    if (validSecs.length) return Math.min(...validSecs)
  }
  return 0
}

// 将 details 列表按 providerGroup 分组 (如 Gemini 算力组、Claude 算力组)
const groupQuotaDetails = (details?: QuotaDetailItem[]) => {
  if (!details || details.length === 0) return {}
  const groups: Record<string, QuotaDetailItem[]> = {}
  for (const item of details) {
    const rawGroup = item.providerGroup || '通用'
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

// 个人微服务与扩展应用项目列表
const myApps = [
  {
    id: 'key-manager',
    name: 'AI 配额监控',
    desc: '全盘管控 Token Plane 托管账号与 API Key 算力配额，支持即时探测与探针联动',
    tag: '内核核心',
    tagClass: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60',
    icon: Bot,
    iconBg: 'bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20',
    path: '/quota'
  },
  {
    id: 'app-hub',
    name: '我的应用生态矩阵',
    desc: '集中管理个人 AI 应用（镜头工坊、幻笔AI 等）与微服务入口',
    tag: '应用生态',
    tagClass: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
    icon: LayoutGrid,
    iconBg: 'bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
    path: '/app-hub'
  }
]

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
      <a-spin description="正在拉取真实算力大盘数据..." />
    </div>

    <!-- 暂无资源数据 -->
    <div v-else-if="quotaStore.keys.length === 0" class="py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
      <a-empty description="大盘暂无 API 资源配置记录">
        <router-link to="/keys">
          <a-button type="primary" class="mt-3! bg-indigo-600! hover:bg-indigo-500! rounded-xl!">
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
                  v-if="item.tokenQuota?.planType"
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border tracking-wider',
                    item.tokenQuota.planType.toUpperCase().includes('ULTRA')
                      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : item.tokenQuota.planType.toUpperCase().includes('PRO')
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700'
                  ]"
                >
                  {{ item.tokenQuota.planType }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {{ item.provider === 'google-antigravity' ? 'Antigravity' : 'OpenAI Codex' }}
                </span>
              </div>
            </div>

            <!-- 配额主体区：左列（圆形仪表+文字，固定宽度）/ 右列（details 伸展占满剩余宽度） -->
            <div
              v-if="item.tokenQuota"
              :class="[
                'flex items-center gap-5 min-w-0 py-1',
                item.tokenQuota.details?.length ? 'justify-between' : 'justify-center'
              ]"
            >
              <!-- 左列：圆形仪表盘 + 倒计时 + 重置时刻 (较宽区域 224px，居中) -->
              <div
                :class="[
                  'flex flex-col items-center justify-center gap-2 shrink-0',
                  item.tokenQuota.details?.length ? 'w-56' : 'w-full'
                ]"
              >
                <!-- 圆形仪表盘 (放大为 110px) -->
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

              <!-- 竖向分隔线 (仅当有 details 时) -->
              <div
                v-if="item.tokenQuota.details?.length"
                class="shrink-0 w-px bg-slate-200 dark:bg-zinc-700/80 self-stretch my-1"
              />

              <!-- 右列：details 分组 (占满剩余宽度的 flex-1) -->
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

                  <!-- 该分组下的算力桶列表 -->
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

            <div v-else-if="!item.tokenQuota" class="p-3 text-xs text-amber-600 bg-amber-50/50 rounded-xl border border-amber-200/50 flex items-center gap-2">
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

      <!-- 4. 我的应用与扩展项目矩阵 (My Apps & Personal Services) -->
      <div class="space-y-3 pt-3 border-t border-slate-200/70 dark:border-zinc-800/80">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutGrid class="w-4 h-4 text-indigo-500" />
            我的应用与微服务项目
          </h3>
          <span class="text-xs text-slate-400 font-mono">
            快捷访问全系个人应用
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="app in myApps"
            :key="app.id"
            @click="router.push(app.path)"
            class="group p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:border-indigo-300 dark:hover:border-indigo-700/70 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div class="flex items-start justify-between">
              <div
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md shrink-0 transition-transform group-hover:scale-105',
                  app.iconBg
                ]"
              >
                <component :is="app.icon" class="w-5 h-5" />
              </div>

              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                  app.tagClass
                ]"
              >
                {{ app.tag }}
              </span>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <span>{{ app.name }}</span>
                <ArrowUpRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {{ app.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
