<script setup lang="ts">
import { computed } from 'vue'
import { theme } from 'antdv-next'
import zhCN from 'antdv-next/locale/zh_CN'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const currentAlgorithm = computed(() => {
  return themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm
})
</script>

<template>
  <a-config-provider
    :locale="zhCN"
    :theme="{
      algorithm: currentAlgorithm,
      token: {
        colorPrimary: '#6366f1',
        borderRadius: 8,
      }
    }"
  >
    <a-app>
      <router-view />
    </a-app>
  </a-config-provider>
</template>
