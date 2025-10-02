-- SQLite Database Schema for Slack LLM Translate Bot

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient queries by user and channel
CREATE INDEX IF NOT EXISTS idx_user_channel 
ON messages(user_id, channel_id, timestamp);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_timestamp
ON messages(timestamp);