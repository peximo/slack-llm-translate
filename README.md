# Slack Translator Bot 🌐

A Slack slash command that translates messages using LLMs (Ollama, Claude, or OpenAI) with tone adaptation and context awareness.

## Features

- **Multi-LLM Support** — Use Ollama (free/local), Claude, or OpenAI
- **Tone Adaptation** — Translate with specific tones (formal, casual, professional, friendly, etc.)
- **Any Language** — Translate to and from any language
- **Conversation Memory** — SQLite-based context for consistent translations
- **Translation Notes** — Get insights on syntactic choices and cultural adaptations

## Usage

```
/translate "Your message here" to Italian with a formal tone
/translate "Ciao, come stai?" to English with a casual tone
/translate "Meeting tomorrow at 3pm" to Japanese with a professional tone
```

### Output Format

The bot responds with:

- ✅ **Translation** — The translated text
- ✏️ **Description** — Brief explanation of the translation approach
- ⚠️ **Content Alert** — Notes on sensitive or culturally specific content (if any)
- 🗒️ **Notes** — Syntactic choices, grammar considerations, register decisions

## Quick Start

### 1. Install

```bash
git clone https://github.com/peximo/slack-llm-translate.git
cd slack-llm-translate
npm install
cp .env.example .env
```

### 2. Configure LLM Provider

Edit `.env` with one of these configurations:

**Ollama (free, local):**
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

### 3. Setup ngrok (Local Development)

```bash
# Install
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Configure
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Start (in separate terminal)
ngrok http 3000
```

### 4. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. Add Slash Command:
   - Command: `/translate`
   - Request URL: `https://YOUR-NGROK-URL.ngrok.io/slack/commands`
   - Description: `Translate messages with tone adaptation`
   - Usage hint: `"message" to [language] with a [tone] tone`
3. Add Bot Scopes in OAuth & Permissions:
   - `chat:write`
   - `commands`
4. Install to Workspace
5. Copy Bot Token to `.env`:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-token-here
   ```

### 5. Run

```bash
npm run dev
```

## Configuration

### Environment Variables

```env
# LLM Provider
LLM_PROVIDER=ollama          # ollama, claude, or openai

# Context Settings
MAX_CONTEXT_CHARS=4000       # Max context size
MIN_RECENT_MESSAGES=3        # Always include N recent messages
MAX_RELEVANT_OLDER=3         # Max relevant older messages
RELEVANCE_THRESHOLD=0.3      # Relevance score (0-1)
DB_CLEANUP_DAYS=30           # Auto-delete after N days

# Temperature (0.0=focused, 1.0=creative)
OLLAMA_TEMPERATURE=0.7
CLAUDE_TEMPERATURE=0.7
OPENAI_TEMPERATURE=0.7
```

## Project Structure

```
slack-llm-translate/
├── prompts/           # Translation prompt templates
├── providers/         # LLM provider implementations
│   ├── base.js
│   ├── ollama.js
│   ├── claude.js
│   ├── openai.js
│   └── index.js
├── utils/
│   ├── database.js
│   └── context-manager.js
├── db/                # SQLite database (auto-created)
├── server.js
└── .env
```

## Provider Comparison

| Provider | Cost | Privacy | Best For |
|----------|------|---------|----------|
| Ollama | Free | 100% Local | Privacy, offline use |
| Claude | ~$3-15/M tokens | API | Quality, nuance |
| OpenAI | ~$0.15-10/M tokens | API | Reliability |

## Troubleshooting

**Bot not responding:**
```bash
npm run dev  # Check logs
```

**ngrok URL changed:**
Update the Slash Command URL in your Slack app settings.

**Reset database:**
```bash
rm -rf db/
npm run dev
```

## License

MIT

## Credits

- [Ollama](https://ollama.ai)
- [Anthropic](https://anthropic.com)
- [OpenAI](https://openai.com)
- [Slack API](https://api.slack.com)
