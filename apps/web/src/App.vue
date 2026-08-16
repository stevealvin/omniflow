<script setup lang="ts">
import { computed } from 'vue'
import { theme } from 'antdv-next'
import zhCN from 'antdv-next/locale/zh_CN'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const themeConfig = computed(() => {
  const isDark = themeStore.isDark
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#059669',
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#f43f5e',
      colorInfo: '#0ea5e9',
      colorBgBase: isDark ? '#09090b' : '#ffffff',
      colorBgContainer: isDark ? '#141417' : '#ffffff',
      colorBgElevated: isDark ? '#1c1c21' : '#ffffff',
      colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      colorBorderSecondary: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      colorText: isDark ? '#f4f4f5' : '#09090b',
      colorTextSecondary: isDark ? '#a1a1aa' : '#64748b',
      borderRadius: 12,
      fontFamily: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    },
    components: {
      Button: {
        borderRadius: 12,
        fontWeight: 600,
      },
      Modal: {
        borderRadiusLG: 24,
      },
      Card: {
        borderRadiusLG: 24,
      },
      Tag: {
        borderRadiusSM: 8,
      }
    }
  }
})
</script>

<template>
  <a-config-provider
    :locale="zhCN"
    :theme="themeConfig"
  >
    <a-app>
      <router-view />
    </a-app>
  </a-config-provider>
</template>
