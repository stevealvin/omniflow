import { Hono } from 'hono'
import {
  listAccounts,
  addAntigravityAccount,
  addCodexAccount,
  refreshAccountQuota,
  deleteAccount
} from '../services/account.service.js'

export const accountsRouter = new Hono()

// GET /api/accounts - 获取所有已添加账号及其算力配额
accountsRouter.get('/accounts', async (c) => {
  const accounts = await listAccounts()
  return c.json({
    success: true,
    data: accounts,
    timestamp: new Date().toISOString()
  })
})

// POST /api/accounts/antigravity - 添加 Google Antigravity 账号
accountsRouter.post('/accounts/antigravity', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name, refreshToken, projectId } = body

    if (!email || !refreshToken) {
      return c.json(
        { success: false, error: 'email 和 refreshToken 为必填项' },
        400
      )
    }

    const account = await addAntigravityAccount({
      email,
      name,
      refreshToken,
      projectId
    })

    return c.json({
      success: true,
      data: account,
      message: 'Google Antigravity 账号添加成功并完成首期配额计算'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message || '添加失败' }, 500)
  }
})

// POST /api/accounts/codex - 添加 OpenAI Codex 账号
accountsRouter.post('/accounts/codex', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name, authType, accessToken, apiKey, planType } = body

    if (!email) {
      return c.json({ success: false, error: 'email 为必填项' }, 400)
    }

    const account = await addCodexAccount({
      email,
      name,
      authType: authType || 'oauth',
      accessToken,
      apiKey
    })

    return c.json({
      success: true,
      data: account,
      message: 'OpenAI Codex 账号添加成功并完成首期配额计算'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message || '添加失败' }, 500)
  }
})

// POST /api/accounts/:id/refresh - 强行刷新指定账号的配额
accountsRouter.post('/accounts/:id/refresh', async (c) => {
  try {
    const id = c.req.param('id')
    const account = await refreshAccountQuota(id)
    return c.json({
      success: true,
      data: account,
      message: '账号配额刷新成功'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message || '刷新失败' }, 404)
  }
})

// DELETE /api/accounts/:id - 删除指定账号
accountsRouter.delete('/accounts/:id', async (c) => {
  const id = c.req.param('id')
  const success = await deleteAccount(id)
  if (success) {
    return c.json({ success: true, message: '账号删除成功' })
  } else {
    return c.json({ success: false, error: '账号不存在或已被删除' }, 404)
  }
})
