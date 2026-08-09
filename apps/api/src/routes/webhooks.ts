import { Hono } from 'hono'
import { dispatchNotification } from '../services/webhooks.service.js'

export const webhooksRouter = new Hono()

// Webhook 通知触发与转发 Endpoint
webhooksRouter.post('/webhooks/notify', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const result = await dispatchNotification(body)
  return c.json(result)
})
