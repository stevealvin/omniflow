import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { corsMiddleware } from './middlewares/cors.js'
import { loggerMiddleware } from './middlewares/logger.js'
import { quotaRouter } from './routes/quota.js'
import { watchRouter } from './routes/watch.js'
import { webhooksRouter } from './routes/webhooks.js'
import { keyQuotaRouter } from './routes/key-quota.js'
import { accountsRouter } from './routes/accounts.js'

const app = new Hono()

// 全局中间件注册
app.use('*', corsMiddleware)
app.use('*', loggerMiddleware)

// 根入口 Endpoint
app.get('/', (c) => {
  return c.json({
    name: '星环流动 (OmniFlow) Backend API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// 路由模块挂载与组装 (/api)
const api = new Hono()
api.route('/', quotaRouter)
api.route('/', watchRouter)
api.route('/', webhooksRouter)
api.route('/', keyQuotaRouter)
api.route('/', accountsRouter)

app.route('/api', api)
app.route('/api/v1', api)

const port = Number(process.env.PORT) || 5100

console.log(`🚀 星环流动 (OmniFlow) 后端 API 已成功运行在 http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
