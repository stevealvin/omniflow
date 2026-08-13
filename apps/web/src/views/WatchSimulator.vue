<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuotaStore } from '@/stores/quota'
import { Watch, RefreshCw, Zap, Cpu, Wifi, BatteryCharging, Check } from '@lucide/vue'

const quotaStore = useQuotaStore()
const isSyncing = ref(false)
const lastSyncTime = ref(new Date().toLocaleTimeString())

const agKey = computed(() => quotaStore.keys.find((k) => k.provider === 'google-antigravity'))
const codexKey = computed(() => quotaStore.keys.find((k) => k.provider === 'openai-codex'))

const agRemaining = computed(() => agKey.value?.tokenQuota?.remainingPercentage ?? 100)
const codexRemaining = computed(() => codexKey.value?.tokenQuota?.remainingPercentage ?? 100)

const triggerWatchSync = async () => {
  isSyncing.value = true
  await new Promise((resolve) => setTimeout(resolve, 800))
  await quotaStore.fetchKeys()
  lastSyncTime.value = new Date().toLocaleTimeString()
  isSyncing.value = false
}

onMounted(() => {
  quotaStore.fetchKeys()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Sub-header Meta Line -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
          Xiaomi Vela OS (390x450 AMOLED)
        </span>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          1:1 还原 Redmi Watch 6 穿戴设备表盘显示与交互体验，实时体验抬腕查额度效果
        </p>
      </div>

      <a-button
        type="primary"
        :loading="isSyncing"
        @click="triggerWatchSync"
        class="inline-flex items-center gap-1.5 font-medium rounded-lg !bg-indigo-600 hover:!bg-indigo-500"
      >
        <template #icon>
          <RefreshCw class="w-4 h-4" />
        </template>
        触发手表同步
      </a-button>
    </div>

    <!-- Watch Device Preview Container -->
    <div class="flex flex-col items-center justify-center py-6">
      <div class="relative">
        <!-- Watch Strap Top -->
        <div class="w-44 h-16 bg-slate-800 dark:bg-zinc-800 mx-auto rounded-t-xl opacity-90 border-t border-x border-slate-700"></div>

        <!-- Redmi Watch 6 Frame (390x450 scale preview) -->
        <div class="w-[320px] h-[370px] bg-slate-950 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 dark:border-zinc-700 relative flex flex-col justify-between overflow-hidden">
          <!-- Watch Hardware Side Crown Button Mockup -->
          <div class="absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-12 bg-slate-700 rounded-r-md border-l border-slate-600"></div>

          <!-- Watch Screen Top Bar -->
          <div class="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 font-mono">
            <span class="flex items-center gap-1 text-indigo-400 font-medium">
              <Watch class="w-3 h-3" />
              星环流动
            </span>
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-0.5 text-emerald-400">
                <Wifi class="w-3 h-3" />
                Vela
              </span>
              <span class="flex items-center gap-0.5">
                <BatteryCharging class="w-3 h-3 text-slate-300" />
                88%
              </span>
            </div>
          </div>

          <!-- Watch Screen Core UI -->
          <div class="my-auto px-1 space-y-3 text-white">
            <!-- Antigravity Quota Row -->
            <div class="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Zap class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-[12px] font-medium leading-tight">Antigravity</div>
                  <div class="text-[10px] text-zinc-400 font-mono">5H 重置</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-indigo-400 font-mono">
                  {{ agRemaining }}%
                </div>
                <div class="text-[9px] text-zinc-400 font-mono">剩余配额</div>
              </div>
            </div>

            <!-- Codex Quota Row -->
            <div class="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Cpu class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-[12px] font-medium leading-tight">Codex API</div>
                  <div class="text-[10px] text-zinc-400 font-mono">5H 重置</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-emerald-400 font-mono">
                  {{ codexRemaining }}%
                </div>
                <div class="text-[9px] text-zinc-400 font-mono">剩余配额</div>
              </div>
            </div>

            <!-- Sync Alert Pill -->
            <div class="text-center pt-1">
              <span class="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-900/60 px-2.5 py-1 rounded-full border border-zinc-800">
                <Check class="w-3 h-3 text-emerald-400" />
                已与云端 Hono 同步 ({{ lastSyncTime }})
              </span>
            </div>
          </div>

          <!-- Watch Screen Bottom Home Indicator -->
          <div class="w-16 h-1 bg-zinc-700 rounded-full mx-auto mb-0.5 opacity-60"></div>
        </div>

        <!-- Watch Strap Bottom -->
        <div class="w-44 h-16 bg-slate-800 dark:bg-zinc-800 mx-auto rounded-b-xl opacity-90 border-b border-x border-slate-700"></div>
      </div>
    </div>
  </div>
</template>
