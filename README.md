# Status Ninja Bot 🥷

A Telegram bot for monitoring API health and sending notifications about their status.

## Features

- Monitor multiple API endpoints for health checks
- Send notifications to Telegram users or groups when status changes
- Configure which chats receive notifications for specific APIs
- Scheduled health checks (every 5 minutes by default)
- Manual trigger of health checks via API
- Export configuration via API

## Setup

### Prerequisites

- [Cloudflare Workers account](https://workers.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Telegram bot (created via [@BotFather](https://t.me/botfather))

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create the D1 database:
   ```
   wrangler d1 create status_ninja
   ```
4. Update `wrangler.toml` with your database ID
5. Configure your secret environment variables:
   ```
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler secret put API_TOKEN
   ```
   Set a strong, random string for API_TOKEN to secure your endpoints.

6. Set up the Telegram webhook:
   ```
   curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_WORKER_URL>/webhook
   ```

7. Deploy the worker:
   ```
   wrangler deploy
   ```

### Usage

Once deployed, interact with your bot in Telegram:

1. Start a chat with your bot and send `/help` for a list of commands
2. Add API endpoints to monitor using the `/add` command
3. Add chat IDs (personal or group) using the `/addchat` command
4. Subscribe chats to receive notifications for specific APIs using the `/subscribe` command

### Protected API Endpoints

The following endpoints require authentication using the API_TOKEN:

- `POST /run-health-check` - Manually trigger a health check
  ```
  curl -X POST https://<YOUR_WORKER_URL>/run-health-check \
    -H "Authorization: Bearer <YOUR_API_TOKEN>"
  ```

- `GET /export-config` - Export current configuration
  ```
  curl https://<YOUR_WORKER_URL>/export-config \
    -H "Authorization: Bearer <YOUR_API_TOKEN>"
  ```