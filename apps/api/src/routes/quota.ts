import { Hono } from 'hono'
import { getQuotaData } from '../services/quota.service.js'

export const quotaRouter = new Hono()

// AI 算力与额度 Endpoint (Route + HTTP Context 处理，调用 Service 业务服务)
quotaRouter.get('/quota', async (c) => {
  const data = await getQuotaData()
  return c.json({
    success: true,
    data,
    updatedAt: new Date().toISOString()
  })
})
