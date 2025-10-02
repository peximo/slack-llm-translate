/**
 * @fileoverview Database management for conversation history
 * 
 * This module provides a persistent storage layer for conversation messages
 * between users and the AI assistant using SQLite.
 * 
 * Features:
 * - Per-user, per-channel conversation tracking
 * - Message history with timestamps
 * - Automatic cleanup of old messages
 * 
 * Database Schema:
 * - messages table: id, user_id, channel_id, role, content, timestamp, created_at
 * - Indexed on (user_id, channel_id, timestamp) for fast queries
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Global database instance
let dbInstance = null;

/**
 * Initialize database
 */
export function initDatabase() {
  if (!dbInstance) {
    const dbDir = join(process.cwd(), 'db');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    dbInstance = new Database(join(dbDir, 'conversations.db'));
    dbInstance.pragma('journal_mode = WAL');
    
    // Initialize schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_channel 
      ON messages(user_id, channel_id, timestamp);
    `);
    
    // Prepare statements
    dbInstance.statements = {
      insertMessage: dbInstance.prepare(`
        INSERT INTO messages (user_id, channel_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `),
      
      getMessages: dbInstance.prepare(`
        SELECT role, content, timestamp
        FROM messages
        WHERE user_id = ? AND channel_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `),
      
      deleteMessages: dbInstance.prepare(`
        DELETE FROM messages
        WHERE user_id = ? AND channel_id = ?
      `),
      
      countMessages: dbInstance.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE user_id = ? AND channel_id = ?
      `),
      
      cleanupOld: dbInstance.prepare(`
        DELETE FROM messages WHERE timestamp < ?
      `)
    };
  }
  return dbInstance;
}

/**
 * Get database instance
 */
function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Add a new message to the conversation history
 * 
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @param {string} role - Message role: 'user' or 'assistant'
 * @param {string} content - Message content/text
 * @returns {Promise<boolean>} True if successful, false on error
 */
export async function addMessage(userId, channelId, role, content) {
  try {
    const db = getDb();
    db.statements.insertMessage.run(userId, channelId, role, content, Date.now());
    return true;
  } catch (error) {
    console.error('Error adding message:', error);
    return false;
  }
}

/**
 * Get conversation history for a user in a channel
 * 
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @param {number} [limit=10] - Maximum number of messages to retrieve
 * @returns {Promise<Array>} Array of message objects with role, content, timestamp
 */
export async function getHistory(userId, channelId, limit = 10) {
  try {
    const db = getDb();
    const messages = db.statements.getMessages.all(userId, channelId, limit);
    return messages.reverse();
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

/**
 * Clear all message history for a user in a channel
 * 
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @returns {Promise<boolean>} True if any messages were deleted
 */
export async function clearHistory(userId, channelId) {
  try {
    const db = getDb();
    const result = db.statements.deleteMessages.run(userId, channelId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

/**
 * Get total message count for a user in a channel
 * 
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @returns {Promise<number>} Total number of messages
 */
export async function getMessageCount(userId, channelId) {
  try {
    const db = getDb();
    const result = db.statements.countMessages.get(userId, channelId);
    return result.count;
  } catch (error) {
    console.error('Error counting messages:', error);
    return 0;
  }
}

/**
 * Delete messages older than specified number of days
 * 
 * @param {number} [daysToKeep=30] - Number of days of history to retain
 * @returns {Promise<number>} Number of messages deleted
 */
export async function cleanupOldMessages(daysToKeep = 30) {
  try {
    const db = getDb();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const result = db.statements.cleanupOld.run(cutoffTime);
    return result.changes;
  } catch (error) {
    console.error('Error cleaning up messages:', error);
    return 0;
  }
}

/**
 * Get extended conversation history with higher limit
 * 
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @param {number} [limit=50] - Maximum number of messages to retrieve
 * @returns {Promise<Array>} Array of message objects with role, content, timestamp
 */
export async function getExtendedHistory(userId, channelId, limit = 50) {
  return getHistory(userId, channelId, limit);
}

/**
 * Close the database connection gracefully
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('Database connection closed');
  }
}

/**
 * Export default object for backward compatibility
 */
export default {
  initDatabase,
  addMessage,
  getHistory,
  getExtendedHistory,
  clearHistory,
  getMessageCount,
  cleanupOldMessages,
  closeDatabase,
};