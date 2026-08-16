import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  // 默认使用 useDark()，自动处理 html.dark 类名与默认 localStorage 持久化
  const isDark = useDark()
  const toggleTheme = useToggle(isDark)

  const mode = computed<ThemeMode>(() => isDark.value ? 'dark' : 'light')

  const setTheme = (newMode: ThemeMode) => {
    isDark.value = newMode === 'dark'
  }

  return {
    isDark,
    mode,
    toggleTheme,
    setTheme
  }
})
