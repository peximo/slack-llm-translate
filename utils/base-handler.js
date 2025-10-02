/**
 * Base class for shared functionality
 */

import { parseCommand } from './command-parser.js';
import { loadPrompt } from '../prompts/index.js';
import { createProvider } from '../providers/index.js';
import contextManager from './context-manager.js';
import { createConfig } from './context-manager.js';

export class BaseHandler {
  constructor(env = {}) {
    this.env = env;
    this.llmProvider = this.initializeLLMProvider(env);
  }

  /**
   * Initialize LLM provider with environment configuration
   */
  initializeLLMProvider(env) {
    const providerName = env.LLM_PROVIDER || 'ollama';
    
    let config;
    switch (providerName.toLowerCase()) {
      case 'ollama':
        config = {
          host: env.OLLAMA_HOST || 'http://localhost:11434',
          model: env.OLLAMA_MODEL || 'llama3.2',
          temperature: parseFloat(env.OLLAMA_TEMPERATURE) || 0.7,
          contextWindow: parseInt(env.OLLAMA_CONTEXT_WINDOW) || 4096
        };
        break;
        
      case 'claude':
        config = {
          apiKey: env.CLAUDE_API_KEY || '',
          model: env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(env.CLAUDE_MAX_TOKENS) || 1024,
          temperature: parseFloat(env.CLAUDE_TEMPERATURE) || 0.7
        };
        break;
        
      case 'openai':
        config = {
          apiKey: env.OPENAI_API_KEY || '',
          model: env.OPENAI_MODEL || 'gpt-4o-mini',
          maxTokens: parseInt(env.OPENAI_MAX_TOKENS) || 1024,
          temperature: parseFloat(env.OPENAI_TEMPERATURE) || 0.7
        };
        break;
        
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
    
    return createProvider(providerName, config);
  }

  /**
   * Generate response using configured LLM provider
   */
  async generateResponse(prompt, conversationHistory = []) {
    return await this.llmProvider.generate(prompt, conversationHistory);
  }

  /**
   * Get home route response data
   */
  getHomeData() {
    return {
      status: 'running',
      provider: this.llmProvider.getName(),
      model: this.llmProvider.config.model || this.llmProvider.model,
      message: 'Slack bot is running! 🚀'
    };
  }

  /**
   * Handle ask endpoint logic
   */
  async handleAskLogic(question, userId = 'test', channelId = 'test', db) {
    const history = await db.getExtendedHistory(userId, channelId, 30);
    const answer = await this.generateResponse(question, history);
    
    return {
      answer,
      provider: this.llmProvider.getName(),
      model: this.llmProvider.config.model || this.llmProvider.model
    };
  }

  /**
   * Process Slack translate command
   */
  async processTranslateCommand(text, userId, channelId, userName, responseUrl, db) {
    const parsed = parseCommand(text);
    
    try {
      // Get extended conversation history
      const history = await db.getExtendedHistory(userId, channelId, 50);
      
      // Get context stats for logging
      const contextConfig = createConfig(this.env);
      const stats = contextManager.getContextStats(history, text);
      console.log('Context stats:', stats);
      console.log(`User: ${userName} (${userId}) in channel ${channelId}`);
      
      // Add user message to database
      await db.addMessage(userId, channelId, 'user', text);
      
      // Get AI response with optimized context
      const language = parsed.options.to || 'en-US';
      const tone = parsed.options.tone || 'neutral';
      const prompt = loadPrompt('translate', {
        message: parsed.text,
        language: language,
        tone: tone
      });
      
      console.debug(prompt);
      
      const answer = await this.generateResponse(prompt, history);
      
      // Save assistant response to database
      await db.addMessage(userId, channelId, 'assistant', answer);
      
      // Send response back to Slack
      const responseType = this.env.RESPONSE_TYPE || 'ephemeral';
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: responseType,
          text: answer,
          mrkdwn: true
        })
      });
      
    } catch (error) {
      console.error('Error processing command:', error);
      
      // Send error message to Slack
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '❌ Sorry, something went wrong. Please try again.'
        })
      });
    }
  }

  /**
   * Get immediate Slack response
   */
  getImmediateSlackResponse() {
    const responseType = this.env.RESPONSE_TYPE || 'ephemeral';
    return {
      response_type: responseType,
      text: `💭 Thinking...`
    };
  }
}