import { Hono } from 'hono'
import {
  listApiKeys,
  addApiKey,
  updateApiKey,
  deleteApiKey,
  probeKeyQuota,
  probeAllKeyQuotas
} from '../services/key-quota.service.js'

export const keyQuotaRouter = new Hono()

// 1. 获取所有 API 密钥与 Token Plane 托管账号列表
keyQuotaRouter.get('/keys', async (c) => {
  const keys = await listApiKeys()
  return c.json({
    success: true,
    data: keys
  })
})

// 2. 添加新 API 密钥或 Token Plane 托管账号
keyQuotaRouter.post('/keys', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.name) {
    return c.json({ success: false, message: '请填写名称' }, 400)
  }
  if (!body.provider) {
    return c.json({ success: false, message: '请选择服务提供商' }, 400)
  }

  const isTokenPlane = body.type === 'token-plane' || body.provider === 'google-antigravity' || body.provider === 'openai-codex'

  const newKey = await addApiKey({
    name: body.name,
    type: isTokenPlane ? 'token-plane' : 'api-key',
    provider: body.provider,
    baseUrl: body.baseUrl || '',
    apiKey: body.apiKey || '',
    refreshToken: body.refreshToken || '',
    accessToken: body.accessToken || '',
    model: body.model || '',
    email: body.email
  })

  return c.json({
    success: true,
    data: newKey
  })
})

// 3. 更新配置
keyQuotaRouter.put('/keys/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const updated = await updateApiKey(id, body)
  if (!updated) {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
  return c.json({
    success: true,
    data: updated
  })
})

// 4. 删除 API 密钥或 Token Plane 账号
keyQuotaRouter.delete('/keys/:id', async (c) => {
  const id = c.req.param('id')
  const success = await deleteApiKey(id)
  if (success) {
    return c.json({ success: true, message: '已成功删除' })
  } else {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
})

// 5. 探针/配额刷新检测单个密钥或账号
keyQuotaRouter.post('/keys/:id/check', async (c) => {
  const id = c.req.param('id')
  const keys = await listApiKeys()
  const target = keys.find((k) => k.id === id)
  if (!target) {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
  const probed = await probeKeyQuota(target)
  return c.json({
    success: true,
    data: probed
  })
})

// 6. 批量探针/配额刷新检测所有密钥或账号
keyQuotaRouter.post('/keys/check-all', async (c) => {
  const results = await probeAllKeyQuotas()
  return c.json({
    success: true,
    data: results
  })
})
