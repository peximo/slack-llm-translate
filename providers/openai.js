// providers/openai.js

import BaseLLMProvider from './base.js';

class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature || 0.7;
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('OpenAI: API key is required');
    }
    return true;
  }

  async generate(prompt, conversationHistory = []) {
    try {
      const context = this.buildContext(conversationHistory, prompt);
      const fullPrompt = `${context}Current message: ${prompt}\n\nProvide a helpful, concise response:`;

      console.log(`[OpenAI] Using model: ${this.model}`);
      console.log(`[OpenAI] Prompt size: ${fullPrompt.length} characters`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('[OpenAI] Error:', error);
      throw new Error(`OpenAI provider error: ${error.message}`);
    }
  }
}

export default OpenAIProvider;
