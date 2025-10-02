// context-manager.js

// Load dotenv in Node.js environment
const dotenv = await import('dotenv');
dotenv.config();

// Create config factory
export function createConfig() {
  return {
    MAX_CONTEXT_CHARS: parseInt(process.env.MAX_CONTEXT_CHARS) || 4000,     // Maximum characters for context
    MIN_RECENT_MESSAGES: parseInt(process.env.MIN_RECENT_MESSAGES) || 3,    // Always include last N messages
    MAX_RELEVANT_OLDER: parseInt(process.env.MAX_RELEVANT_OLDER) || 3,      // Max older relevant messages to include
    MIN_KEYWORD_LENGTH: parseInt(process.env.MIN_KEYWORD_LENGTH) || 4,      // Minimum length for keywords
    RELEVANCE_THRESHOLD: parseFloat(process.env.RELEVANCE_THRESHOLD) || 0.3,  // Minimum relevance score (0-1)
  };
}

// Default config for Node.js
const CONFIG = createConfig();

/**
 * Extract keywords from a text
 */
function extractKeywords(text) {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has',
    'had', 'does', 'did', 'am', 'please', 'thanks', 'thank', 'hello', 'hi',
    'hey', 'okay', 'yes', 'no',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word =>
      word.length >= CONFIG.MIN_KEYWORD_LENGTH &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word), // Filter out pure numbers
    );

  // Count word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate relevance score between current prompt and a message
 */
function calculateRelevance(message, keywords) {
  if (keywords.length === 0) {
    return 0;
  }

  const messageText = message.content.toLowerCase();
  const messageWords = new Set(
    messageText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= CONFIG.MIN_KEYWORD_LENGTH),
  );

  // Count how many keywords appear in the message
  let matches = 0;
  keywords.forEach(keyword => {
    if (messageWords.has(keyword) || messageText.includes(keyword)) {
      matches++;
    }
  });

  // Calculate relevance score
  const score = matches / keywords.length;

  return score;
}

/**
 * Select relevant messages from history
 */
function selectRelevantMessages(conversationHistory, currentPrompt) {
  if (conversationHistory.length === 0) {
    return [];
  }

  const keywords = extractKeywords(currentPrompt);
  console.log('Keywords extracted:', keywords);

  // Always include the most recent messages
  const recentMessages = conversationHistory.slice(-CONFIG.MIN_RECENT_MESSAGES);

  // Find relevant older messages
  const olderMessages = conversationHistory.slice(0, -CONFIG.MIN_RECENT_MESSAGES);

  if (olderMessages.length === 0) {
    return recentMessages;
  }

  // Calculate relevance scores for older messages
  const scoredMessages = olderMessages.map(msg => ({
    message: msg,
    score: calculateRelevance(msg, keywords),
  }));

  // Filter by threshold and sort by score
  const relevantOlder = scoredMessages
    .filter(item => item.score >= CONFIG.RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONFIG.MAX_RELEVANT_OLDER)
    .map(item => item.message);

  console.log(`Selected ${relevantOlder.length} relevant older messages`);

  // Combine and sort by timestamp to maintain chronological order
  const combined = [...relevantOlder, ...recentMessages];
  combined.sort((a, b) => a.timestamp - b.timestamp);

  return combined;
}

/**
 * Truncate messages to fit within character limit
 */
function truncateToCharLimit(messages, maxChars) {
  let totalChars = 0;
  const result = [];

  // Add from newest to oldest until we hit the limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgSize = msg.content.length + 30; // +30 for role prefix and formatting

    if (totalChars + msgSize > maxChars && result.length > 0) {
      console.log(`Truncated at ${result.length} messages (${totalChars} chars)`);
      break;
    }

    result.unshift(msg);
    totalChars += msgSize;
  }

  return result;
}

/**
 * Build optimized context from conversation history
 */
function buildOptimizedContext(conversationHistory, currentPrompt) {
  // Step 1: Select relevant messages
  const relevantMessages = selectRelevantMessages(conversationHistory, currentPrompt);

  // Step 2: Truncate to character limit if needed
  const truncatedMessages = truncateToCharLimit(
    relevantMessages,
    CONFIG.MAX_CONTEXT_CHARS,
  );

  console.log(`Context: ${truncatedMessages.length} messages from ${conversationHistory.length} total`);

  // Step 3: Format the context
  let context = '';

  if (truncatedMessages.length > 0) {
    context += 'Conversation context:\n\n';

    truncatedMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const isRecent = index >= truncatedMessages.length - CONFIG.MIN_RECENT_MESSAGES;
      const prefix = isRecent ? '→' : '•';

      context += `${prefix} ${role}: ${msg.content}\n`;
    });

    context += '\n---\n\n';
  }

  return context;
}

/**
 * Get context statistics
 */
function getContextStats(conversationHistory, currentPrompt) {
  const relevantMessages = selectRelevantMessages(conversationHistory, currentPrompt);
  const truncatedMessages = truncateToCharLimit(relevantMessages, CONFIG.MAX_CONTEXT_CHARS);

  const totalChars = truncatedMessages.reduce((sum, msg) => sum + msg.content.length, 0);

  return {
    totalMessages: conversationHistory.length,
    relevantMessages: relevantMessages.length,
    includedMessages: truncatedMessages.length,
    totalChars: totalChars,
    utilizationPercent: ((totalChars / CONFIG.MAX_CONTEXT_CHARS) * 100).toFixed(1),
  };
}

export default {
  CONFIG,
  buildOptimizedContext,
  getContextStats,
  extractKeywords,
  calculateRelevance
};
