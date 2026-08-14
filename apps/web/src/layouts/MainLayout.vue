<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useQuotaStore } from '@/stores/quota'
import {
  Zap,
  Key,
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

const menuItems = [
  { key: '/', title: '仪表数据大盘', icon: Zap },
  { key: '/quota', title: 'AI 算力控制中心', icon: Key },
  { key: '/app-hub', title: '我的应用生态', icon: LayoutGrid }
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
    <!-- 顶部固定 Header 栏（沉浸式磨砂玻璃，高度从 64px 缩减至 48px） -->
    <a-layout-header class="!h-12 !px-4 sm:!px-6 border-b border-slate-200/80 dark:border-zinc-800/80 glass-header fixed top-0 left-0 right-0 z-50 flex items-center justify-between">
      <!-- 左侧：品牌 Logo -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 cursor-pointer" @click="navigateTo('/')">
          <img src="/favicon.svg" class="w-7 h-7 shrink-0" />
          <span class="font-bold text-sm tracking-tight text-slate-900 dark:text-white">星环流动</span>
        </div>
      </div>

      <!-- 中间：当前页面统一标题 -->
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {{ currentPageTitle }}
        </h2>
      </div>

      <!-- 右侧：快捷操作按钮 -->
      <div class="flex items-center gap-2">
        <!-- 手动刷新按钮 -->
        <a-button
          type="text"
          :loading="quotaStore.loading"
          @click="quotaStore.fetchKeys"
          class="!flex items-center justify-center !w-8 !h-8 !rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
          title="刷新数据"
        >
          <template #icon>
            <RefreshCw class="w-3.5 h-3.5" />
          </template>
        </a-button>

        <!-- 日夜间主题切换按钮 -->
        <a-button
          type="text"
          @click="themeStore.toggleTheme"
          class="!flex items-center justify-center !w-8 !h-8 !rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
          :title="themeStore.isDark ? '切换至白天模式' : '切换至暗黑模式'"
        >
          <template #icon>
            <Sun v-if="themeStore.isDark" class="w-3.5 h-3.5 text-amber-400" />
            <Moon v-else class="w-3.5 h-3.5 text-slate-700" />
          </template>
        </a-button>
      </div>
    </a-layout-header>

    <!-- 主体布局（固定侧栏 + 独立滚动内容区） -->
    <div class="flex pt-12 h-screen overflow-hidden">
      <!-- 左侧固定 Sidebar：毛玻璃渐变 -->
      <aside
        :class="[
          'fixed top-12 left-0 bottom-0 z-40 glass-sidebar border-r border-slate-200/60 dark:border-zinc-800/80 py-3 px-2 flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden shadow-sm',
          isCollapsed ? 'w-14' : 'w-52'
        ]"
      >
        <!-- 侧栏导航菜单列表 -->
        <div class="space-y-1">
          <div
            v-for="item in menuItems"
            :key="item.key"
            @click="navigateTo(item.key)"
            :title="isCollapsed ? item.title : ''"
            :class="[
              'w-full h-8.5 flex items-center rounded-xl cursor-pointer select-none transition-colors duration-200 group overflow-hidden',
              activeKey === item.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <!-- 图标容器 -->
            <div class="w-8.5 h-8.5 flex-shrink-0 flex items-center justify-center">
              <component :is="item.icon" class="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
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
            class="w-full h-8.5 flex items-center rounded-xl cursor-pointer select-none transition-colors duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white overflow-hidden group"
          >
            <!-- 控制按钮图标框 -->
            <div class="w-8.5 h-8.5 flex-shrink-0 flex items-center justify-center">
              <PanelLeftOpen v-if="isCollapsed" class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110" />
              <PanelLeftClose v-else class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110" />
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
          'flex-1 h-[calc(100vh-3rem)] overflow-y-auto transition-all duration-300 ease-in-out p-4 sm:p-6',
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
