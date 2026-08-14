import { app } from './app.js'
import { serve } from '@hono/node-server'

const port = Number(process.env.PORT) || 5100

console.log(`🚀 星环流动 (OmniFlow) 后端 API 已成功运行在 http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
