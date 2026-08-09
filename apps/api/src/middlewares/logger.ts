import { createMiddleware } from 'hono/factory'

// 全局请求日志中间件（记录方法、URL、状态码与响应耗时）
export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`)
})
