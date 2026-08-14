import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { corsMiddleware } from './middlewares/cors.js'
import { loggerMiddleware } from './middlewares/logger.js'
import { quotaRouter } from './routes/quota.js'
import { watchRouter } from './routes/watch.js'

export const app = new Hono()

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

app.route('/api', api)
app.route('/api/v1', api)

// Vercel Serverless Function 处理器导出
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
export const OPTIONS = handle(app)
export default handle(app)
