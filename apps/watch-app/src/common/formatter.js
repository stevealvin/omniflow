/**
 * 格式化剩余倒计时
 * @param {number} totalSeconds
 * @returns {string} 如 "4h 25m" 或 "18m 30s"
 */
export function formatCountdown(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m ${secs}s`
}

/**
 * 获取配额百分比对应的视觉颜色主题与状态标签
 * @param {number} remainingPercent
 * @param {string} provider
 * @returns {{ colorClass: string, bgClass: string, pillClass: string, statusLabel: string }}
 */
export function getPercentTheme(remainingPercent, provider = '') {
  if (remainingPercent <= 15) {
    return {
      colorClass: 'text-rose',
      bgClass: 'bg-rose',
      pillClass: 'pill-rose',
      statusLabel: '告警'
    }
  }
  if (remainingPercent <= 50) {
    return {
      colorClass: 'text-amber',
      bgClass: 'bg-amber',
      pillClass: 'pill-amber',
      statusLabel: '紧张'
    }
  }
  const isAg = provider === 'google-antigravity'
  return {
    colorClass: isAg ? 'text-indigo' : 'text-emerald',
    bgClass: isAg ? 'bg-indigo' : 'bg-emerald',
    pillClass: isAg ? 'pill-indigo' : 'pill-emerald',
    statusLabel: '健康'
  }
}

/**
 * 获取 Provider 对应的头像简写与背景
 * @param {string} provider
 * @returns {{ text: string, bgClass: string }}
 */
export function getProviderAvatar(provider) {
  switch (provider) {
    case 'google-antigravity':
      return { text: 'AG', bgClass: 'bg-indigo-box' }
    case 'openai-codex':
      return { text: 'CX', bgClass: 'bg-emerald-box' }
    case 'google-aistudio':
      return { text: 'GS', bgClass: 'bg-indigo-box' }
    case 'openai-compatible':
      return { text: 'OA', bgClass: 'bg-emerald-box' }
    default:
      return { text: 'KEY', bgClass: 'bg-emerald-box' }
  }
}

/**
 * 格式化 API Key 掩码显示
 * @param {string} apiKey
 * @returns {string}
 */
export function maskApiKey(apiKey) {
  if (!apiKey) return ''
  if (apiKey.length <= 10) return '••••••••'
  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`
}

/**
 * 格式化测试时间为 HH:mm
 * @param {string} timeStr
 * @returns {string}
 */
export function formatTestedTime(timeStr) {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return timeStr
  }
}
