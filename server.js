// server.js
import dotenv from 'dotenv';
import express from 'express';
import db from './utils/database.js';
import { BaseHandler } from './utils/base-handler.js';

dotenv.config();

// Initialize database for Node.js
db.initDatabase();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize handler
let handler;

try {
  handler = new BaseHandler(process.env);
} catch (error) {
  console.error('❌ Error initializing handler:', error.message);
  process.exit(1);
}

// Home route
app.get('/', (req, res) => {
  res.json(handler.getHomeData());
});

// Test endpoint
app.post('/ask', async (req, res) => {
  const { question, userId = 'test', channelId = 'test' } = req.body;

  try {
    const result = await handler.handleAskLogic(question, userId, channelId, db);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Slack command endpoint
app.post('/slack/commands', async (req, res) => {
  const { text, user_id, channel_id, user_name, command, response_url } = req.body;

  // Acknowledge immediately (Slack requires response within 3 seconds)
  res.json(handler.getImmediateSlackResponse());

  if(command === '/translate' ) {
    // Process asynchronously
    await handler.processTranslateCommand(text, user_id, channel_id, user_name, response_url, db);
  }
});

// Server startup
const PORT = parseInt(process.env.PORT) || 3000;
const DB_CLEANUP_DAYS = parseInt(process.env.DB_CLEANUP_DAYS) || 30;

app.listen(PORT, async () => {
  const homeData = handler.getHomeData();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🤖 Slack Bot with Multi-LLM Support                       ║
╠════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${PORT}                        ║
║  Database:   db/conversations.db                           ║
║  Provider:   ${homeData.provider.toUpperCase().padEnd(48)} ║
║  Model:      ${homeData.model.padEnd(48)} ║
║  Response:   ${(process.env.RESPONSE_TYPE || 'ephemeral').padEnd(48)} ║
╚════════════════════════════════════════════════════════════╝
  `);

  const cleaned = await db.cleanupOldMessages(DB_CLEANUP_DAYS);
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old messages`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  db.closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  db.closeDatabase();
  process.exit(0);
});