<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{
    height?: number
  }>(),
  {
    height: 560
  }
)

const themeStore = useThemeStore()
const containerRef = ref<HTMLDivElement | null>(null)

const renderWidget = () => {
  if (!containerRef.value) return
  containerRef.value.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'tradingview-widget-container'
  wrapper.style.height = `${props.height}px`
  wrapper.style.width = '100%'

  const widgetDiv = document.createElement('div')
  widgetDiv.className = 'tradingview-widget-container__widget'
  widgetDiv.style.height = '100%'
  widgetDiv.style.width = '100%'
  wrapper.appendChild(widgetDiv)

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
  script.async = true
  script.innerHTML = JSON.stringify({
    colorTheme: themeStore.isDark ? 'dark' : 'light',
    isTransparent: true,
    width: '100%',
    height: props.height,
    locale: 'zh_CN',
    importanceFilter: '-1,0,1'
  })

  wrapper.appendChild(script)
  containerRef.value.appendChild(wrapper)
}

onMounted(() => {
  renderWidget()
})

watch(
  () => [props.height, themeStore.isDark],
  () => {
    renderWidget()
  }
)
</script>

<template>
  <div class="relative w-full overflow-hidden transition-all duration-300 rounded-2xl" :style="{ height: `${height}px` }">
    <div ref="containerRef" class="w-full h-full"></div>
  </div>
</template>
