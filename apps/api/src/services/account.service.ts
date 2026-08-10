import { supabase } from '../utils/supabase.js'
import type {
  ManagedAccount,
  AntigravityAccount,
  CodexAccount,
  CreateAntigravityAccountInput,
  CreateCodexAccountInput,
  AccountQuota
} from '../types/account.js'
import { QuotaProviderFactory } from './providers/factory.js'

let accountsFallback: ManagedAccount[] = []

const fallbackQuota: AccountQuota = {
  usedPercentage: 0,
  remainingPercentage: 100,
  status: 'untested',
  resetIntervalHours: 5,
  secondsRemaining: 18000,
  nextResetTime: '05:00:00'
}

export const listAccounts = async (): Promise<ManagedAccount[]> => {
  try {
    const { data, error } = await supabase
      .from('api_key_configs')
      .select('*')
      .eq('type', 'token-plane')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const isAg = row.provider === 'google-antigravity'
        const quotaData: AccountQuota = row.token_plane_quota
          ? { ...row.token_plane_quota, status: row.token_plane_quota.status || 'healthy' }
          : fallbackQuota

        return {
          id: row.id,
          platform: isAg ? 'antigravity' : 'codex',
          email: row.email || 'user@omniflow.dev',
          name: row.name || (isAg ? 'Google Antigravity 账号' : 'OpenAI Codex 账号'),
          status: (row.status as any) || 'active',
          refreshToken: row.api_key,
          accessToken: row.api_key,
          quota: quotaData,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.last_tested_at || new Date().toISOString()
        } as ManagedAccount
      })
    }
  } catch (err: any) {
    console.warn('[Supabase Accounts 读取提示]', err.message)
  }

  return accountsFallback
}

export const getAccountById = async (id: string): Promise<ManagedAccount | undefined> => {
  const accounts = await listAccounts()
  return accounts.find((a) => a.id === id)
}

export const addAntigravityAccount = async (
  input: CreateAntigravityAccountInput
): Promise<AntigravityAccount> => {
  const now = new Date().toISOString()
  const accountId = `ag_${Date.now()}`

  const provider = QuotaProviderFactory.getProvider('google-antigravity')
  const fetchRes = await provider.fetchQuota({
    id: accountId,
    name: input.name || `Antigravity (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'google-antigravity',
    baseUrl: 'https://daily-cloudcode-pa.googleapis.com',
    apiKey: input.refreshToken,
    refreshToken: input.refreshToken,
    model: '',
    status: 'untested'
  })

  const dbRow = {
    id: accountId,
    name: input.name || `Antigravity (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'google-antigravity',
    base_url: 'https://daily-cloudcode-pa.googleapis.com',
    api_key: input.refreshToken,
    model: '',
    email: input.email,
    status: fetchRes.status,
    last_tested_at: now,
    token_plane_quota: fetchRes.tokenPlaneQuota
  }

  try {
    await supabase.from('api_key_configs').insert([dbRow])
  } catch (err: any) {
    console.error('[Supabase Account 写入错误]', err.message)
  }

  const accountQuota: AccountQuota = fetchRes.tokenPlaneQuota
    ? { ...fetchRes.tokenPlaneQuota, status: fetchRes.status === 'active' ? 'healthy' : 'warning' }
    : fallbackQuota

  const account: AntigravityAccount = {
    id: accountId,
    platform: 'antigravity',
    email: input.email,
    name: dbRow.name,
    status: fetchRes.status === 'active' ? 'active' : 'disabled',
    refreshToken: input.refreshToken,
    projectId: input.projectId || 'antigravity-cloud-code-prod',
    isGcpTos: true,
    quota: accountQuota,
    createdAt: now,
    updatedAt: now
  }

  accountsFallback.unshift(account)
  return account
}

export const addCodexAccount = async (
  input: CreateCodexAccountInput
): Promise<CodexAccount> => {
  const now = new Date().toISOString()
  const accountId = `codex_${Date.now()}`
  const token = input.accessToken || input.apiKey || ''

  const provider = QuotaProviderFactory.getProvider('openai-codex')
  const fetchRes = await provider.fetchQuota({
    id: accountId,
    name: input.name || `Codex (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'openai-codex',
    baseUrl: 'https://chatgpt.com/backend-api',
    apiKey: token,
    accessToken: token,
    model: '',
    status: 'untested'
  })

  const dbRow = {
    id: accountId,
    name: input.name || `Codex (${input.email.split('@')[0]})`,
    type: 'token-plane',
    provider: 'openai-codex',
    base_url: 'https://chatgpt.com/backend-api',
    api_key: token,
    model: '',
    email: input.email,
    status: fetchRes.status,
    last_tested_at: now,
    token_plane_quota: fetchRes.tokenPlaneQuota
  }

  try {
    await supabase.from('api_key_configs').insert([dbRow])
  } catch (err: any) {
    console.error('[Supabase Account 写入错误]', err.message)
  }

  const accountQuota: AccountQuota = fetchRes.tokenPlaneQuota
    ? { ...fetchRes.tokenPlaneQuota, status: fetchRes.status === 'active' ? 'healthy' : 'warning' }
    : fallbackQuota

  const account: CodexAccount = {
    id: accountId,
    platform: 'codex',
    email: input.email,
    name: dbRow.name,
    status: fetchRes.status === 'active' ? 'active' : 'disabled',
    authType: input.authType,
    accessToken: input.accessToken,
    apiKey: input.apiKey,
    quota: accountQuota,
    createdAt: now,
    updatedAt: now
  }

  accountsFallback.unshift(account)
  return account
}

export const refreshAccountQuota = async (id: string): Promise<ManagedAccount> => {
  const account = await getAccountById(id)
  if (!account) {
    throw new Error(`Account with id ${id} not found`)
  }

  const isAg = account.platform === 'antigravity'
  const token = (account as AntigravityAccount).refreshToken || (account as CodexAccount).accessToken || (account as CodexAccount).apiKey || ''
  const provider = QuotaProviderFactory.getProvider(isAg ? 'google-antigravity' : 'openai-codex')

  const fetchRes = await provider.fetchQuota({
    id: account.id,
    name: account.name,
    type: 'token-plane',
    provider: isAg ? 'google-antigravity' : 'openai-codex',
    baseUrl: isAg ? 'https://daily-cloudcode-pa.googleapis.com' : 'https://chatgpt.com/backend-api',
    apiKey: token,
    refreshToken: token,
    accessToken: token,
    model: '',
    status: 'untested'
  })

  const now = new Date().toISOString()

  try {
    await supabase
      .from('api_key_configs')
      .update({
        token_plane_quota: fetchRes.tokenPlaneQuota,
        last_tested_at: now
      })
      .eq('id', id)
  } catch (err: any) {
    console.error('[Supabase Account 刷新错误]', err.message)
  }

  const updatedQuota: AccountQuota = fetchRes.tokenPlaneQuota
    ? { ...fetchRes.tokenPlaneQuota, status: fetchRes.status === 'active' ? 'healthy' : 'warning' }
    : account.quota

  return {
    ...account,
    quota: updatedQuota,
    updatedAt: now
  }
}

export const deleteAccount = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('api_key_configs').delete().eq('id', id)
  } catch (err: any) {
    console.error('[Supabase Account 删除错误]', err.message)
  }
  accountsFallback = accountsFallback.filter((a) => a.id !== id)
  return true
}
