<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{
    symbol?: string
    title?: string
    width?: string | number
  }>(),
  {
    symbol: 'FX_IDC:USDCNY',
    title: 'USD/CNY',
    width: '100%'
  }
)

const themeStore = useThemeStore()
const containerRef = ref<HTMLDivElement | null>(null)

const renderWidget = () => {
  if (!containerRef.value) return
  containerRef.value.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'tradingview-widget-container'
  wrapper.style.width = typeof props.width === 'number' ? `${props.width}px` : props.width

  const widgetDiv = document.createElement('div')
  widgetDiv.className = 'tradingview-widget-container__widget'
  widgetDiv.style.width = '100%'
  wrapper.appendChild(widgetDiv)

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
  script.async = true
  script.innerHTML = JSON.stringify({
    symbols: [
      {
        proName: props.symbol,
        title: props.title
      }
    ],
    showSymbolLogo: true,
    isTransparent: true,
    displayMode: 'regular',
    colorTheme: themeStore.isDark ? 'dark' : 'light',
    locale: 'zh_CN'
  })

  wrapper.appendChild(script)
  containerRef.value.appendChild(wrapper)
}

onMounted(() => {
  renderWidget()
})

watch(
  () => [props.symbol, props.title, props.width, themeStore.isDark],
  () => {
    renderWidget()
  }
)
</script>

<template>
  <!-- 经典的 Ticker Tape 原生动态平滑滚动条，左图标 + 中标题 + 右数值 -->
  <div class="relative overflow-hidden rounded-2xl min-w-[220px] flex items-center">
    <div ref="containerRef" class="w-full"></div>
  </div>
</template>
