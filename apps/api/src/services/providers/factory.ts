import type { IQuotaProvider } from './base.provider.js'
import { AntigravityProvider } from './antigravity.provider.js'
import { CodexProvider } from './codex.provider.js'
import { OpenAIProvider } from './openai.provider.js'
import { AIStudioProvider } from './aistudio.provider.js'
import { AnthropicProvider } from './anthropic.provider.js'
import { GenericProvider } from './generic.provider.js'

export class QuotaProviderFactory {
  private static providers: Record<string, IQuotaProvider> = {
    'google-antigravity': new AntigravityProvider(),
    'openai-codex': new CodexProvider(),
    'openai-compatible': new OpenAIProvider(),
    'google-aistudio': new AIStudioProvider(),
    'anthropic': new AnthropicProvider(),
    'generic': new GenericProvider()
  }

  public static getProvider(providerId: string): IQuotaProvider {
    return this.providers[providerId] || this.providers['generic']
  }
}
