<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{
    symbol: string
    title?: string
    height?: number
    defaultRange?: '1D' | '5D' | '1M' | '3M' | '12M' | 'ALL' | string
  }>(),
  {
    height: 360,
    defaultRange: '5D'
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
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
  script.async = true

  const rangeSuffix = props.defaultRange.toUpperCase()
  const displayTitle = props.title || props.symbol

  script.innerHTML = JSON.stringify({
    symbols: [
      [displayTitle, `${props.symbol}|${rangeSuffix}`]
    ],
    chartOnly: false,
    width: '100%',
    height: props.height,
    locale: 'zh_CN',
    timeZone: 'Asia/Shanghai',
    colorTheme: themeStore.isDark ? 'dark' : 'light',
    autosize: false,
    showVolume: false,
    showMA: false,
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: 'right',
    scaleMode: 'Normal',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', sans-serif",
    fontSize: '12',
    noTimeScale: false,
    valuesTracking: '1',
    changeMode: 'price-and-percent',
    showFloatingTooltip: true,
    chartType: 'area',
    isTransparent: true,
    dateRanges: [
      '5d|240',
      '1m|240',
      '3m|240',
      '12m|1D',
      'all|1W'
    ]
  })

  wrapper.appendChild(script)
  containerRef.value.appendChild(wrapper)
}

onMounted(() => {
  renderWidget()
})

watch(
  () => [props.symbol, props.title, props.height, props.defaultRange, themeStore.isDark],
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
