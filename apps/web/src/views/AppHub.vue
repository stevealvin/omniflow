<script setup lang="ts">
import { LayoutGrid, Link, FileText, Sparkles, Watch, Plus } from '@lucide/vue'
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        扩展应用中心 (Personal App Hub)
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        预留可插拔式个人微服务插件槽，支持随手记、短链中转与 System Prompt 模版库扩展
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Short Links Card -->
      <a-card variant="borderless" class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900">
        <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Link class="w-5 h-5" />
        </div>
        <h3 class="font-semibold text-slate-900 dark:text-white">短链与中转</h3>
        <p class="text-xs text-slate-400 mt-1">短链接生成与重定向服务，基于 Hono Edge 快速缓存</p>
        <a-tag color="blue" class="mt-4 !rounded-md">模块可插拔</a-tag>
      </a-card>

      <!-- Watch Quick Notes Card -->
      <a-card variant="borderless" class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900">
        <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
          <Watch class="w-5 h-5" />
        </div>
        <h3 class="font-semibold text-slate-900 dark:text-white">手表随手记 / 待办</h3>
        <p class="text-xs text-slate-400 mt-1">在 Redmi Watch 6 上录入的 Idea 同步至云端数据库</p>
        <a-tag color="purple" class="mt-4 !rounded-md">手表联动</a-tag>
      </a-card>

      <!-- Prompt Library Card -->
      <a-card variant="borderless" class="rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <Sparkles class="w-5 h-5" />
        </div>
        <h3 class="font-semibold text-slate-900 dark:text-white">Prompt 模版中枢</h3>
        <p class="text-xs text-slate-400 mt-1">管理通用 Agent 提示词与自定义命令模板</p>
        <a-tag color="emerald" class="mt-4 !rounded-md">AI 工具链</a-tag>
      </a-card>
    </div>
  </div>
</template>
