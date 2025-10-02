// providers/ollama.js

import BaseLLMProvider from './base.js';

class OllamaProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.host = config.host || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
    this.temperature = config.temperature || 0.7;
    this.contextWindow = config.contextWindow || 4096;
  }

  validateConfig() {
    if (!this.model) {
      throw new Error('Ollama: model is required');
    }
    return true;
  }

  async generate(prompt, conversationHistory = []) {
    try {
      const context = this.buildContext(conversationHistory, prompt);
      const fullPrompt = `${context}Current message: ${prompt}\n\nProvide a helpful, concise response:`;

      console.log(`[Ollama] Using model: ${this.model}`);
      console.log(`[Ollama] Prompt size: ${fullPrompt.length} characters`);

      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            num_ctx: this.contextWindow,
            temperature: this.temperature
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('[Ollama] Error:', error);
      throw new Error(`Ollama provider error: ${error.message}`);
    }
  }
}

export default OllamaProvider;
