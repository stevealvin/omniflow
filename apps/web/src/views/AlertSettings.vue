<script setup lang="ts">
import { ref } from 'vue'
import { Bell, Send, ShieldCheck, CheckCircle2 } from '@lucide/vue'

const tgBotToken = ref('')
const tgChatId = ref('')
const barkKey = ref('')
const quotaThreshold = ref(20)
const isSaved = ref(false)

const saveSettings = () => {
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <!-- Header Banner -->
    <div class="pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        星环通知与路由网关
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        配置额度不足（如 Antigravity / Codex < {{ quotaThreshold }}%）时的即时推送到手机与 Watch 警报
      </p>
    </div>

    <a-card variant="borderless" class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900">
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Bell class="w-4 h-4 text-indigo-500" />
            触发规则设置
          </h3>
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-slate-900 dark:text-white">额度预警百分比阈值</span>
              <p class="text-xs text-slate-400">当任一 AI 算力剩余低于该比例时发送警报</p>
            </div>
            <div class="flex items-center gap-2">
              <a-input-number v-model:value="quotaThreshold" :min="5" :max="50" class="!w-24" />
              <span class="text-sm text-slate-500">%</span>
            </div>
          </div>
        </div>

        <div class="space-y-4 pt-2">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Send class="w-4 h-4 text-indigo-500" />
            通道配置 (Telegram / Bark)
          </h3>

          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Telegram Bot Token</label>
            <a-input v-model:value="tgBotToken" placeholder="bot123456789:ABCdefGHIjklMNO..." class="!rounded-lg" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Telegram Chat ID</label>
            <a-input v-model:value="tgChatId" placeholder="-100xxxxxxxxx" class="!rounded-lg" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Bark iOS Key (可选)</label>
            <a-input v-model:value="barkKey" placeholder="https://api.day.app/your_key/" class="!rounded-lg" />
          </div>
        </div>

        <div class="pt-4 flex items-center gap-4">
          <a-button type="primary" @click="saveSettings" class="!bg-indigo-600 hover:!bg-indigo-500 !rounded-lg">
            保存星环通知配置
          </a-button>
          <span v-if="isSaved" class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 class="w-4 h-4" />
            配置已保存
          </span>
        </div>
      </div>
    </a-card>
  </div>
</template>
