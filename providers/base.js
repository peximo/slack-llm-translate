// providers/base.js
import contextManager from '../utils/context-manager.js';

/**
 * Base class for all LLM providers
 */
class BaseLLMProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate a response from the LLM
   * @param {string} prompt - The prompt to send
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<string>} - The generated response
   */
  async generate(prompt, conversationHistory = []) {
    throw new Error('generate() must be implemented by provider');
  }

  /**
   * Build context from conversation history
   * @param {Array} conversationHistory - Previous messages
   * @param {string} currentPrompt - Current user message
   * @returns {string} - Formatted context
   */
  buildContext(conversationHistory, currentPrompt) {
    return contextManager.buildOptimizedContext(conversationHistory, currentPrompt);
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Validate configuration
   * @returns {boolean}
   */
  validateConfig() {
    return true;
  }
}

export default BaseLLMProvider;
