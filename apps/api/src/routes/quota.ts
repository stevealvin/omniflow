import { Hono } from 'hono'
import {
  listQuotaConfigs,
  addQuotaConfig,
  updateQuotaConfig,
  deleteQuotaConfig,
  probeQuotaConfig,
  probeAllQuotaConfigs
} from '../services/quota.service.js'

export const quotaRouter = new Hono()

/**
 * 获取所有算力配额与 API 密钥配置列表
 */
quotaRouter.get('/quota', async (c) => {
  const configs = await listQuotaConfigs()
  return c.json({
    success: true,
    data: configs,
    updatedAt: new Date().toISOString()
  })
})

/**
 * 添加新 API 资源或 Token Plane 托管账号配置
 */
quotaRouter.post('/quota', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.name) {
    return c.json({ success: false, message: '请填写名称' }, 400)
  }
  if (!body.provider) {
    return c.json({ success: false, message: '请选择服务提供商' }, 400)
  }

  const isTokenPlane = body.type === 'token-plane' || body.provider === 'google-antigravity' || body.provider === 'openai-codex'

  const newConfig = await addQuotaConfig({
    name: body.name,
    type: isTokenPlane ? 'token-plane' : 'api-key',
    provider: body.provider,
    baseUrl: body.baseUrl || '',
    apiKey: body.apiKey || '',
    refreshToken: body.refreshToken || '',
    accessToken: body.accessToken || '',
    email: body.email
  })

  return c.json({
    success: true,
    data: newConfig
  })
})

/**
 * 更新指定算力资源配置
 */
quotaRouter.put('/quota/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const updated = await updateQuotaConfig(id, body)
  if (!updated) {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
  return c.json({
    success: true,
    data: updated
  })
})

/**
 * 删除指定算力资源配置
 */
quotaRouter.delete('/quota/:id', async (c) => {
  const id = c.req.param('id')
  const success = await deleteQuotaConfig(id)
  if (success) {
    return c.json({ success: true, message: '已成功删除' })
  } else {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
})

/**
 * 探针与配额刷新检测单个资源
 */
quotaRouter.post('/quota/:id/check', async (c) => {
  const id = c.req.param('id')
  const configs = await listQuotaConfigs()
  const target = configs.find((k) => k.id === id)
  if (!target) {
    return c.json({ success: false, message: '未找到指定记录' }, 404)
  }
  const probed = await probeQuotaConfig(target)
  return c.json({
    success: true,
    data: probed
  })
})

/**
 * 批量探针与配额刷新检测所有资源
 */
quotaRouter.post('/quota/check-all', async (c) => {
  const results = await probeAllQuotaConfigs()
  return c.json({
    success: true,
    data: results
  })
})
