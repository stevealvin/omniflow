<script setup lang="ts">
import { ref } from 'vue'
import {
  BarChart2,
  Gauge,
  Calendar,
  Newspaper,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Maximize2
} from '@lucide/vue'

import MarketCandleChart from './market/components/MarketCandleChart.vue'
import MarketSingleQuote from './market/components/MarketSingleQuote.vue'
import MarketTechnicalGauge from './market/components/MarketTechnicalGauge.vue'
import MarketEconomicCalendar from './market/components/MarketEconomicCalendar.vue'
import MarketNewsTimeline from './market/components/MarketNewsTimeline.vue'

// 核心 K 线资产定义（BTC & ETH 双旗舰）
const assets = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    pair: 'BTC / USDT',
    symbol: 'BINANCE:BTCUSDT',
    badge: 'BTC',
    color: 'amber'
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    pair: 'ETH / USDT',
    symbol: 'BINANCE:ETHUSDT',
    badge: 'ETH',
    color: 'indigo'
  }
]

// 走势图视图模式：'all' 并排展示 | 单币聚焦 'BTC' | 'ETH'
const activeChartTab = ref<'all' | 'BTC' | 'ETH'>('all')

// 卡片折叠状态
const isSectionExpanded = ref<Record<string, boolean>>({
  charts: true,
  gauges: true,
  calendar: true,
  news: true
})

const toggleSection = (key: string) => {
  isSectionExpanded.value[key] = !isSectionExpanded.value[key]
}
</script>

<template>
  <div class="w-full space-y-6">
    <!-- 1. 顶栏 Hero Banner (紧凑低高度 + USD/CNY 实时纯数值报价) -->
    <div
      class="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl py-3 px-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
    >
      <!-- 背景光晕装饰 -->
      <div
        class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-linear-to-br from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none"
      ></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <h1 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            全球宏观与加密资产行情看板
          </h1>
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            TradingView 经典蜡烛 K 线 · 26 项量化多空指标打分 · 全球非农/CPI 宏观日历 · 7×24h 突发快讯
          </p>
        </div>

        <!-- 右侧：USD/CNY 纯数值报价 + 实时连接状态 -->
        <div class="shrink-0 flex items-center gap-3">
          <!-- USD/CNY 实时流式滚动报价组件 -->
          <div class="min-w-45 flex items-center">
            <MarketSingleQuote symbol="FX_IDC:USDCNY" />
          </div>

          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs backdrop-blur-md"
          >
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            实时流 (Live)
          </span>
        </div>
      </div>
    </div>

    <!-- 2. 第一行：多维资产走势大盘 (左 7 栏) + 量化技术多空罗盘 (右 5 栏) 并排对齐 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <!-- 左侧：多维资产行情走势 (占 7 栏) -->
      <div
        class="xl:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-3 border-b border-slate-100 dark:border-white/4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs"
            >
              <BarChart2 class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  多维资产行情走势
                </h2>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  1W / 1M / 3M / 1Y / ALL
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                包含开高低收完整柱线与均线标尺。
              </p>
            </div>
          </div>

          <!-- 视图切换 Pill 控制条 -->
          <div class="flex items-center gap-2">
            <div class="inline-flex p-1 bg-slate-100/80 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/50 dark:border-white/4">
              <button
                @click="activeChartTab = 'all'"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 select-none active:scale-[0.98]',
                  activeChartTab === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
                <span>并排</span>
              </button>
              <button
                v-for="asset in assets"
                :key="asset.id"
                @click="activeChartTab = asset.id as any"
                :class="[
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 select-none active:scale-[0.98]',
                  activeChartTab === asset.id
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                <Maximize2 v-if="activeChartTab === asset.id" class="w-3.5 h-3.5" />
                <span>{{ asset.badge }}</span>
              </button>
            </div>

            <button
              @click="toggleSection('charts')"
              class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <ChevronUp v-if="isSectionExpanded.charts" class="w-4 h-4" />
              <ChevronDown v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 走势图内容区 -->
        <div v-show="isSectionExpanded.charts" class="p-5 flex-1">
          <!-- 模式 A：BTC & ETH 双列并排展示 -->
          <div v-if="activeChartTab === 'all'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <div
              v-for="asset in assets"
              :key="asset.id"
              class="rounded-2xl border border-slate-200/70 dark:border-white/6 bg-slate-50/40 dark:bg-zinc-950/40 p-3 hover:shadow-sm transition-all duration-200"
            >
              <MarketCandleChart :symbol="asset.symbol" default-range="5D" :height="380" />
            </div>
          </div>

          <!-- 模式 B：单币聚焦模式 -->
          <div v-else class="rounded-2xl border border-slate-200/70 dark:border-white/6 bg-slate-50/40 dark:bg-zinc-950/40 p-4 h-full">
            <div
              v-for="asset in assets"
              :key="asset.id"
              v-show="activeChartTab === asset.id"
            >
              <MarketCandleChart :symbol="asset.symbol" default-range="5D" :height="380" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：量化技术多空罗盘 (占 5 栏，紧密位于走势图右边) -->
      <div
        class="xl:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col"
      >
        <div
          @click="toggleSection('gauges')"
          class="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 select-none transition-colors border-b border-slate-100 dark:border-white/4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs"
            >
              <Gauge class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  量化技术多空罗盘
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  26 项指标实时评分
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                融合 15 组均线与 11 组震荡指标输出 5 档评级。
              </p>
            </div>
          </div>

          <button
            @click.stop="toggleSection('gauges')"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <ChevronUp v-if="isSectionExpanded.gauges" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
        </div>

        <div v-show="isSectionExpanded.gauges" class="p-5 flex-1 flex flex-col justify-center">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="asset in assets"
              :key="asset.id"
              class="rounded-2xl border border-slate-200/70 dark:border-white/6 bg-slate-50/40 dark:bg-zinc-950/40 p-3 hover:shadow-sm transition-all duration-200"
            >
              <MarketTechnicalGauge :symbol="asset.symbol" :height="380" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 第二行：宏观日历 (左 5 栏) + 全球加密快讯 (右 7 栏) -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <!-- 宏观财经大事记 (占 5 栏) -->
      <div
        class="xl:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col"
      >
        <div
          @click="toggleSection('calendar')"
          class="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 select-none transition-colors border-b border-slate-100 dark:border-white/4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs"
            >
              <Calendar class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  全球宏观财经日历
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  非农 / CPI / 利率决议
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                追踪非农、美联储议息与 CPI 通胀公布。
              </p>
            </div>
          </div>

          <button
            @click.stop="toggleSection('calendar')"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <ChevronUp v-if="isSectionExpanded.calendar" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
        </div>

        <div v-show="isSectionExpanded.calendar" class="p-5 flex-1">
          <div class="rounded-2xl border border-slate-200/70 dark:border-white/6 bg-slate-50/40 dark:bg-zinc-950/40 p-2 h-full">
            <MarketEconomicCalendar :height="480" />
          </div>
        </div>
      </div>

      <!-- 全球加密与财经快讯 (占 7 栏) -->
      <div
        class="xl:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col"
      >
        <div
          @click="toggleSection('news')"
          class="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 select-none transition-colors border-b border-slate-100 dark:border-white/4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-2xs"
            >
              <Newspaper class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  全球加密与财经快讯
                </h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  实时通讯社
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                实时聚合全球顶级媒体深度资讯与行情解读。
              </p>
            </div>
          </div>

          <button
            @click.stop="toggleSection('news')"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <ChevronUp v-if="isSectionExpanded.news" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
        </div>

        <div v-show="isSectionExpanded.news" class="p-5 flex-1">
          <div class="rounded-2xl border border-slate-200/70 dark:border-white/6 bg-slate-50/40 dark:bg-zinc-950/40 p-2 h-full">
            <MarketNewsTimeline :height="480" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
