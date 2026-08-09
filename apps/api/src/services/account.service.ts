import { supabase } from '../utils/supabase.js'
import type {
  ManagedAccount,
  AntigravityAccount,
  CodexAccount,
  CreateAntigravityAccountInput,
  CreateCodexAccountInput,
  AccountQuota
} from '../types/account.js'
import { calculateQuotaResetTime } from './quota.service.js'

// 动态构建算力配额计算结构
const buildAntigravityQuota = (): AccountQuota => {
  const { secondsRemaining, resetTimeString } = calculateQuotaResetTime()
  return {
    usedPercentage: 35,
    remainingPercentage: 65,
    status: 'healthy',
    resetIntervalHours: 5,
    secondsRemaining,
    nextResetTime: resetTimeString,
    subscriptionTier: 'Pro / Ultra 优先配额',
    models: [
      { name: 'Gemini 3.6 Flash (High)', limit: '高优先级算力', used: '35%' },
      { name: 'Gemini 3.6 Pro', limit: '海量 Token 额度', used: '28%' }
    ],
    lastUpdated: new Date().toISOString()
  }
}

const buildCodexQuota = (planType = '开发者 Pro 版'): AccountQuota => {
  const { secondsRemaining, resetTimeString } = calculateQuotaResetTime()
  return {
    usedPercentage: 42,
    remainingPercentage: 58,
    status: 'healthy',
    resetIntervalHours: 5,
    secondsRemaining: secondsRemaining + 120,
    nextResetTime: resetTimeString,
    subscriptionTier: planType,
    models: [
      { name: 'gpt-4o-codex', limit: '500 请求 / 5小时', used: '42%' },
      { name: 'o3-mini-reasoning', limit: '200 请求 / 5小时', used: '18%' }
    ],
    lastUpdated: new Date().toISOString()
  }
}

// 内存保底备用
let accountsFallback: ManagedAccount[] = []

// 获取所有托管账号 (从 Supabase 数据库按需拉取)
export const listAccounts = async (): Promise<ManagedAccount[]> => {
  const { secondsRemaining, resetTimeString } = calculateQuotaResetTime()

  try {
    const { data, error } = await supabase
      .from('api_key_configs')
      .select('*')
      .eq('type', 'token-plane')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const isAg = row.provider === 'google-antigravity'
        const quotaData = row.token_plane_quota || (isAg ? buildAntigravityQuota() : buildCodexQuota(row.plan_type))
        quotaData.secondsRemaining = Math.max(0, secondsRemaining)
        quotaData.nextResetTime = resetTimeString

        return {
          id: row.id,
          platform: isAg ? 'antigravity' : 'codex',
          email: row.email || 'user@omniflow.dev',
          name: row.name || (isAg ? 'Google Antigravity 账号' : 'OpenAI Codex 账号'),
          status: (row.status as any) || 'active',
          refreshToken: row.api_key,
          accessToken: row.api_key,
          planType: row.plan_type || (isAg ? 'Pro / Ultra 优先配额' : '开发者 Pro 版'),
          quota: quotaData,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.last_tested_at || new Date().toISOString()
        } as ManagedAccount
      })
    }
  } catch (err: any) {
    console.warn('[Supabase Accounts 读取提示]', err.message)
  }

  return accountsFallback.map((acc) => ({
    ...acc,
    quota: {
      ...acc.quota,
      secondsRemaining: Math.max(0, secondsRemaining),
      nextResetTime: resetTimeString
    }
  }))
}

export const getAccountById = async (id: string): Promise<ManagedAccount | undefined> => {
  const accounts = await listAccounts()
  return accounts.find((a) => a.id === id)
}

// 添加 Google Antigravity 账号并持久化至 Supabase
export const addAntigravityAccount = async (
  input: CreateAntigravityAccountInput
): Promise<AntigravityAccount> => {
  const now = new Date().toISOString()
  const accountId = `ag_${Date.now()}`
  const quota = buildAntigravityQuota()

  const dbRow = {
    id: accountId,
    name: input.name || `Antigravity (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'google-antigravity',
    base_url: 'https://daily-cloudcode-pa.googleapis.com',
    api_key: input.refreshToken,
    model: 'Gemini 3.6 Flash / Pro',
    email: input.email,
    plan_type: 'Pro / Ultra 优先配额',
    status: 'active',
    last_tested_at: now,
    token_plane_quota: quota
  }

  try {
    await supabase.from('api_key_configs').insert([dbRow])
  } catch (err: any) {
    console.error('[Supabase Account 写入错误]', err.message)
  }

  const account: AntigravityAccount = {
    id: accountId,
    platform: 'antigravity',
    email: input.email,
    name: dbRow.name,
    status: 'active',
    refreshToken: input.refreshToken,
    projectId: input.projectId || 'antigravity-cloud-code-prod',
    isGcpTos: true,
    quota,
    createdAt: now,
    updatedAt: now
  }

  accountsFallback.unshift(account)
  return account
}

// 添加 OpenAI Codex 账号并持久化至 Supabase
export const addCodexAccount = async (
  input: CreateCodexAccountInput
): Promise<CodexAccount> => {
  const now = new Date().toISOString()
  const accountId = `codex_${Date.now()}`
  const planType = input.planType || '开发者 Pro 版'
  const quota = buildCodexQuota(planType)

  const dbRow = {
    id: accountId,
    name: input.name || `Codex (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'openai-codex',
    base_url: 'https://chatgpt.com/backend-api',
    api_key: input.accessToken || input.apiKey || '',
    model: 'gpt-4o-codex / o3-mini',
    email: input.email,
    plan_type: planType,
    status: 'active',
    last_tested_at: now,
    token_plane_quota: quota
  }

  try {
    await supabase.from('api_key_configs').insert([dbRow])
  } catch (err: any) {
    console.error('[Supabase Account 写入错误]', err.message)
  }

  const account: CodexAccount = {
    id: accountId,
    platform: 'codex',
    email: input.email,
    name: dbRow.name,
    status: 'active',
    authType: input.authType,
    accessToken: input.accessToken,
    apiKey: input.apiKey,
    planType,
    quota,
    createdAt: now,
    updatedAt: now
  }

  accountsFallback.unshift(account)
  return account
}

// 刷新指定账号配额
export const refreshAccountQuota = async (id: string): Promise<ManagedAccount> => {
  const account = await getAccountById(id)
  if (!account) {
    throw new Error(`Account with id ${id} not found`)
  }

  const newQuota =
    account.platform === 'antigravity'
      ? buildAntigravityQuota()
      : buildCodexQuota((account as CodexAccount).planType)

  try {
    await supabase
      .from('api_key_configs')
      .update({
        token_plane_quota: newQuota,
        last_tested_at: new Date().toISOString()
      })
      .eq('id', id)
  } catch (err: any) {
    console.error('[Supabase Account 刷新错误]', err.message)
  }

  return {
    ...account,
    quota: newQuota,
    updatedAt: new Date().toISOString()
  }
}

// 删除指定账号
export const deleteAccount = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('api_key_configs').delete().eq('id', id)
  } catch (err: any) {
    console.error('[Supabase Account 删除错误]', err.message)
  }
  accountsFallback = accountsFallback.filter((a) => a.id !== id)
  return true
}
