import { Hono } from 'hono'
import { getWatchSyncData } from '../services/watch.service.js'

export const watchRouter = new Hono()

// Redmi Watch 6 同步 Endpoint
watchRouter.get('/watch/sync', async (c) => {
  const result = await getWatchSyncData()
  return c.json(result)
})

watchRouter.post('/watch/sync', async (c) => {
  const result = await getWatchSyncData()
  return c.json(result)
})

