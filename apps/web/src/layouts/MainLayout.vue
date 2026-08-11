<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useQuotaStore } from '@/stores/quota'
import {
  Zap,
  Key,
  Watch,
  Bell,
  LayoutGrid,
  Sun,
  Moon,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const quotaStore = useQuotaStore()

// 侧边栏折叠/展开状态
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 侧边栏导航菜单项
const menuItems = [
  { key: '/', title: '仪表数据大盘', icon: Zap },
  { key: '/keys', title: 'API 密钥与算力控制台', icon: Key },
  { key: '/watch-simulator', title: 'Redmi Watch 6 模拟器', icon: Watch },
  { key: '/alerts', title: '星环通知与路由', icon: Bell },
  { key: '/app-hub', title: '扩展应用中心', icon: LayoutGrid }
]

const activeKey = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '星环流动 OmniFlow')

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <a-layout
    :class="[
      'min-h-screen h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300',
      themeStore.isDark ? 'bg-mesh-dark' : 'bg-mesh-light'
    ]"
  >
    <!-- 顶部固定 Header 栏（沉浸式磨砂玻璃） -->
    <a-layout-header class="!h-16 !px-4 sm:!px-6 border-b border-slate-200/80 dark:border-zinc-800/80 glass-header fixed top-0 left-0 right-0 z-50 flex items-center justify-between">
      <!-- 左侧：品牌 Logo (直接引用 /favicon.svg，无额外包裹与样式) -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2.5 cursor-pointer" @click="navigateTo('/')">
          <img src="/favicon.svg" class="w-9 h-9 shrink-0" />
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-base tracking-tight text-slate-900 dark:text-white">星环流动</span>
            <span class="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-mono">OmniFlow</span>
          </div>
        </div>
      </div>

      <!-- 中间：当前页面统一标题 -->
      <div class="flex items-center gap-2">
        <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {{ currentPageTitle }}
        </h2>
      </div>

      <!-- 右侧：快捷操作按钮 -->
      <div class="flex items-center gap-2.5">
        <!-- 系统运行状态指示标签 -->
        <div class="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          系统正常
        </div>

        <!-- 手动刷新按钮 -->
        <a-button
          type="text"
          :loading="quotaStore.loading"
          @click="quotaStore.fetchKeys"
          class="!flex items-center justify-center !w-9 !h-9 !rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
          title="刷新数据"
        >
          <template #icon>
            <RefreshCw class="w-4 h-4" />
          </template>
        </a-button>

        <!-- 日夜间主题切换按钮 -->
        <a-button
          type="text"
          @click="themeStore.toggleTheme"
          class="!flex items-center justify-center !w-9 !h-9 !rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
          :title="themeStore.isDark ? '切换至白天模式' : '切换至暗黑模式'"
        >
          <template #icon>
            <Sun v-if="themeStore.isDark" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-700" />
          </template>
        </a-button>
      </div>
    </a-layout-header>

    <!-- 主体布局（固定侧栏 + 独立滚动内容区） -->
    <div class="flex pt-16 h-screen overflow-hidden">
      <!-- 左侧固定 Sidebar：毛玻璃渐变 -->
      <aside
        :class="[
          'fixed top-16 left-0 bottom-0 z-40 glass-sidebar border-r border-slate-200/60 dark:border-zinc-800/80 py-4 px-2.5 flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden shadow-sm',
          isCollapsed ? 'w-14' : 'w-52'
        ]"
      >
        <!-- 侧栏导航菜单列表 -->
        <div class="space-y-1.5">
          <div
            v-for="item in menuItems"
            :key="item.key"
            @click="navigateTo(item.key)"
            :title="isCollapsed ? item.title : ''"
            :class="[
              'w-full h-9 flex items-center rounded-xl cursor-pointer select-none transition-colors duration-200 group overflow-hidden',
              activeKey === item.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <!-- 图标容器 -->
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center">
              <component :is="item.icon" class="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>

            <!-- 平滑文本淡出与展平动画 -->
            <div
              :class="[
                'whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-xs font-medium pr-2 truncate',
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
              ]"
            >
              {{ item.title }}
            </div>
          </div>
        </div>

        <!-- 侧栏底端：展开/收起控制按钮 -->
        <div class="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
          <div
            @click="toggleSidebar"
            :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
            class="w-full h-9 flex items-center rounded-xl cursor-pointer select-none transition-colors duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white overflow-hidden group"
          >
            <!-- 控制按钮图标框 -->
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center">
              <PanelLeftOpen v-if="isCollapsed" class="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110" />
              <PanelLeftClose v-else class="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110" />
            </div>

            <!-- 控制按钮文字 -->
            <div
              :class="[
                'whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-xs font-medium pr-2',
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
              ]"
            >
              收起侧边栏
            </div>
          </div>
        </div>
      </aside>

      <!-- 独立滚动的右侧内容区域 -->
      <main
        :class="[
          'flex-1 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300 ease-in-out p-4 sm:p-6',
          isCollapsed ? 'ml-14' : 'ml-52'
        ]"
      >
        <div class="max-w-7xl mx-auto pb-12">
          <router-view />
        </div>
      </main>
    </div>
  </a-layout>
</template>

<style scoped>
aside {
  will-change: width;
}
main {
  will-change: margin-left;
}
</style>
