// providers/claude.js

import BaseLLMProvider from './base.js';

class ClaudeProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature || 0.7;
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('Claude: API key is required');
    }
    return true;
  }

  async generate(prompt, conversationHistory = []) {
    try {
      const context = this.buildContext(conversationHistory, prompt);
      const fullPrompt = `${context}Current message: ${prompt}\n\nProvide a helpful, concise response:`;

      console.log(`[Claude] Using model: ${this.model}`);
      console.log(`[Claude] Prompt size: ${fullPrompt.length} characters`);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('[Claude] Error:', error);
      throw new Error(`Claude provider error: ${error.message}`);
    }
  }
}

export default ClaudeProvider;
