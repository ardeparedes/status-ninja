import { createDb } from './db';
import { createTelegramHandler, TelegramUpdate } from './handlers/telegram-handler';
import { createHealthCheckService } from './services/health-check-service';
import { createApiService } from './services/api-service';
import { apiTable, chatTable, apiChatsTable } from './db/schema';
import { eq } from 'drizzle-orm';

export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const db = createDb(env.DB);

    // Health check endpoint - no authentication required
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle Telegram webhook
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update = await request.json();
        console.log('Received Telegram webhook update:', JSON.stringify(update));
        
        // Check if update has basic required properties
        if (!update || typeof update !== 'object') {
          console.error('Invalid Telegram update format:', update);
          return new Response('Invalid update format', { status: 400 });
        }
        
        // Process with new handler
        const telegramHandler = createTelegramHandler(db, env.TELEGRAM_BOT_TOKEN);
        return telegramHandler.handleUpdate(update as TelegramUpdate);
      } catch (error) {
        console.error('Error handling webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
      }
    }

    // Check API authentication for protected endpoints
    if (url.pathname === '/run-health-check' || url.pathname === '/export-config') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== env.API_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Manual trigger of health check (authenticated endpoint)
    if (url.pathname === '/run-health-check' && request.method === 'POST') {
      try {
        // Create services with dependency injection
        const healthCheckService = createHealthCheckService(db, env.TELEGRAM_BOT_TOKEN);
        
        // Trigger the health check in the background
        ctx.waitUntil(healthCheckService.runHealthCheckForAllApis());
        
        return new Response('Health check triggered', {
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (error) {
        console.error('Error triggering health check:', error);
        return new Response('Error triggering health check', { status: 500 });
      }
    }

    // Export configuration for backward compatibility
    if (url.pathname === '/export-config' && request.method === 'GET') {
      try {
        // Get all APIs
        const apis = await db.select().from(apiTable);
        
        // Format data 
        const configData = {
          apis: await Promise.all(apis.map(async (api) => {
            // Get chat IDs for this API
            const apiChats = await db.select({
              chatId: chatTable.id
            })
            .from(apiChatsTable)
            .leftJoin(chatTable, eq(apiChatsTable.chatId, chatTable.id))
            .where(eq(apiChatsTable.apiId, api.id));
            
            const chatIds = apiChats
              .filter(ac => ac.chatId !== null)
              .map(ac => ac.chatId!.toString());
            
            return {
              name: api.name,
              url: api.url,
              chat_ids: chatIds
            };
          }))
        };
        
        return new Response(JSON.stringify(configData, null, 2), {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error exporting config:', error);
        return new Response('Error exporting configuration', { status: 500 });
      }
    }
    
    // Default response for other routes
    return new Response('Status Ninja Bot API', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  // Scheduled tasks
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Connect to the database
    const db = createDb(env.DB);
    
    // Create services with dependency injection
    const healthCheckService = createHealthCheckService(db, env.TELEGRAM_BOT_TOKEN);
    
    // Run health check on schedule
    if (event.cron === "*/5 * * * *") { // Every 5 minutes
      ctx.waitUntil(healthCheckService.runHealthCheckForAllApis());
    }
  }
}; 