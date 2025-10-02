# Slack LLM Bot 🤖

Intelligent Slack bot with multi-LLM support (Ollama, Claude, OpenAI) featuring conversation memory and smart context management.

## ✨ Features

- 🔌 **Multi-LLM Support** - Ollama (local/free), Claude, or OpenAI
- 💬 **Conversation Memory** - SQLite-based persistent storage
- 🧠 **Smart Context** - Automatically selects relevant past messages
- 🔒 **Privacy First** - Local processing with Ollama or secure API calls
- ⚡ **Fast & Efficient** - Optimized context window usage

## 🔌 Provider Comparison

| Provider | Cost | Privacy | Best For |
|----------|------|---------|----------|
| Ollama | Free | 100% Local | Privacy, no cost, offline |
| Claude | ~$3-15/M tokens | API | Quality, large context |
| OpenAI | ~$0.15-10/M tokens | API | Reliability, GPT-4 |

## 📋 Prerequisites

- Node.js 18+
- Slack workspace (admin access)
- One of:
    - Ollama (local/free)
    - Claude API key
    - OpenAI API key
- **ngrok** (for local development/testing)

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/yourusername/slack-llm-translate.git
cd slack-llm-translate
npm install
```

### 2. Configure Provider

```bash
cp .env.example .env
```

**Ollama:**
```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_HOST=http://localhost:11434
```

**Claude:**
```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-xxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
```

**OpenAI:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini
```

### 3. Testing with ngrok (Local Development)

#### Install and setup ngrok

```bash
# Install (macOS)
brew install ngrok

# Or download from: https://ngrok.com/download

# Configure (get token from ngrok.com)
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### Start bot and ngrok

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

Copy the `https://` URL from ngrok output (e.g., `https://abc123.ngrok.io`)

### 4. Setup Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. **Add Slash Command:**
    - Go to "Slash Commands" → "Create New Command"
    - Command: `/ask`
    - Request URL: `https://YOUR-NGROK-URL.ngrok.io/slack/commands`
    - Description: "Ask the AI bot a question"
    - Usage hint: "your question here"
    - Save
3. **Add Bot Scopes:**
    - Go to "OAuth & Permissions"
    - Add these scopes:
        - `chat:write`
        - `commands`
4. **Install to Workspace:**
    - Click "Install to Workspace"
    - Authorize the app
5. **Copy Bot Token:**
    - Copy the "Bot User OAuth Token" (starts with `xoxb-`)
    - Add it to your `.env`:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-token-here
   ```

### 5. Test the Bot

In any Slack channel where the bot is present:

```
/ask What is machine learning?
/ask My name is Mario
/ask What did I just tell you?
```

The bot should respond using your chosen LLM provider!

## 📖 Usage Examples

```
/ask What is machine learning?
/ask My name is Mario
/ask What did I just tell you? (remembers context!)
/ask Explain quantum computing in simple terms
/ask Summarize our last conversation
```

## 🏗️ Project Structure

```
slack-llm-translate/
├── providers/          # LLM provider implementations
│   ├── base.js
│   ├── ollama.js
│   ├── claude.js
│   ├── openai.js
│   └── index.js
├── utils/
│   ├── database.js
│   └── context-manager.js
├── db/                 # SQLite database (auto-created)
├── server.js
└── .env
```

## ⚙️ Configuration

### Switch Providers

Edit `.env`:
```env
LLM_PROVIDER=ollama  # or claude, openai
```

Restart:
```bash
npm run dev
# or: pm2 restart slack-bot
```

### Context Settings

```env
MAX_CONTEXT_CHARS=4000      # Max context size
MIN_RECENT_MESSAGES=3       # Always include N recent
MAX_RELEVANT_OLDER=3        # Max relevant old messages
RELEVANCE_THRESHOLD=0.3     # Relevance score (0-1)
DB_CLEANUP_DAYS=30          # Auto-delete old messages
```

### Temperature

```env
OLLAMA_TEMPERATURE=0.7      # 0.0=focused, 1.0=creative
CLAUDE_TEMPERATURE=0.7
OPENAI_TEMPERATURE=0.7
```

## 🔧 Troubleshooting

### Bot not responding

```bash
# Check logs
npm run dev

# Verify Ollama (if using)
curl http://localhost:11434/api/tags

# Test Claude API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

### ngrok issues

```bash
# Check if ngrok is running
curl http://localhost:4040/api/tunnels

# Restart ngrok
# Ctrl+C in ngrok terminal, then:
ngrok http 3000

# Remember to update Slack command URL with new ngrok URL!
```

### Slack webhook errors

- Make sure ngrok is running and the URL is correct
- Update the Slash Command URL in Slack when ngrok URL changes
- Check that your `.env` has the correct `SLACK_BOT_TOKEN`

### Reset database

```bash
rm -rf db/
npm run dev  # Recreates
```

### Reinstall dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🧪 Testing

### Local API test

```bash
# Test bot endpoint
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Hello!","userId":"test","channelId":"test"}'

# Test conversation memory
curl -X POST http://localhost:3000/ask \
  -d '{"question":"My name is Mario","userId":"test","channelId":"test"}'

curl -X POST http://localhost:3000/ask \
  -d '{"question":"What is my name?","userId":"test","channelId":"test"}'
```

### Test via ngrok URL

```bash
curl -X POST https://YOUR-NGROK-URL.ngrok.io/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Hello from ngrok!","userId":"test","channelId":"test"}'
```

## 🚀 Deployment

For production deployment (when moving beyond local testing), see `DEPLOYMENT.md` for guides on:

- DigitalOcean / AWS / Railway
- Docker / Docker Compose
- PM2 / Nginx / SSL

**Note:** In production, you'll replace the ngrok URL with your actual domain/server URL in the Slack app configuration.

## 🤝 Contributing

```bash
git checkout -b feature/amazing-feature
# Make changes
git commit -m 'Add feature'
git push origin feature/amazing-feature
```

## 📝 License

MIT License - see LICENSE

## 🙏 Credits

- [Ollama](https://ollama.ai)
- [Anthropic](https://anthropic.com)
- [OpenAI](https://openai.com)
- [Slack API](https://api.slack.com)
- [ngrok](https://ngrok.com)

## 💬 Support

- 🐛 [Issues](https://github.com/yourusername/slack-llm-translate/issues)
- 💬 [Discussions](https://github.com/yourusername/slack-llm-translate/discussions)
- 📧 your.email@example.com

## ⚠️ Privacy

- **Ollama:** All data local, 100% private
- **Cloud APIs:** Messages sent to provider servers
- **Data retention:** Auto-delete after 30 days (configurable)
- **ngrok:** Free tier tunnels are public URLs but encrypted (HTTPS)

## 🎯 Development Tips

1. **ngrok URL changes:** Free ngrok URLs change each restart. Update Slack command URL accordingly
2. **Keep ngrok running:** Bot won't receive Slack requests if ngrok is down
3. **Use ngrok inspect:** Visit `http://localhost:4040` to see all requests in real-time
4. **Upgrade ngrok:** Paid plans offer static URLs and custom domains

---

⭐ **Star this repo if you find it helpful!**
