import type { IQuotaProvider } from './base.provider.js'
import { AntigravityProvider } from './antigravity.provider.js'
import { CodexProvider } from './codex.provider.js'
import { OpenAIProvider } from './openai.provider.js'
import { AIStudioProvider } from './aistudio.provider.js'
import { GenericProvider } from './generic.provider.js'

/**
 * Quota Provider 策略工厂类
 */
export class QuotaProviderFactory {
  private static providers: Record<string, IQuotaProvider> = {
    'google-antigravity': new AntigravityProvider(),
    'openai-codex': new CodexProvider(),
    'openai-compatible': new OpenAIProvider(),
    'google-aistudio': new AIStudioProvider(),
    'generic': new GenericProvider()
  }

  /**
   * 根据 providerId 获取对应的策略实例，未匹配时降级回退至 GenericProvider
   */
  public static getProvider(providerId: string): IQuotaProvider {
    return this.providers[providerId] || this.providers['generic']
  }
}
