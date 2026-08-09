import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  // 默认使用白天 (Light) 模式（按用户要求设为默认）
  const mode = ref<ThemeMode>('light')

  const toggleTheme = () => {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
  }

  const setTheme = (newMode: ThemeMode) => {
    mode.value = newMode
  }

  // 监听模式变更，自动同步控制 HTML 根节点的 dark class 类名
  watchEffect(() => {
    const root = document.documentElement
    if (mode.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  })

  return {
    mode,
    toggleTheme,
    setTheme,
    isDark: computed(() => mode.value === 'dark'),
  }
})
