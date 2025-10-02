// providers/index.js

import OllamaProvider from './ollama.js';
import ClaudeProvider from './claude.js';
import OpenAIProvider from './openai.js';

const PROVIDERS = {
  ollama: OllamaProvider,
  claude: ClaudeProvider,
  openai: OpenAIProvider
};

/**
 * Create LLM provider based on configuration
 * @param {string} providerName - Name of the provider (ollama, claude, openai)
 * @param {Object} config - Provider-specific configuration
 * @returns {BaseLLMProvider} - Provider instance
 */
function createProvider(providerName, config) {
  const ProviderClass = PROVIDERS[providerName.toLowerCase()];

  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerName}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const provider = new ProviderClass(config);
  provider.validateConfig();

  console.log(`✅ Initialized provider: ${providerName}`);
  return provider;
}

/**
 * Get list of available providers
 * @returns {Array<string>}
 */
function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

export {
  createProvider,
  getAvailableProviders,
  PROVIDERS
};
