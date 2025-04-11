import { Database } from '../db';
import { ApiService } from './api-service';
import { NotificationService } from './notification-service';

/**
 * Service for handling health check operations
 */
export class HealthCheckService {
  constructor(
    private db: Database,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  /**
   * Run health check for all APIs
   */
  async runHealthCheckForAllApis(): Promise<void> {
    try {
      // Get all APIs
      const apis = await this.apiService.listApis();
      
      // Check each API
      for (const api of apis) {
        await this.checkApiHealth(api.id, api.name, api.url);
      }
    } catch (error) {
      console.error('Error running health check:', error);
    }
  }

  /**
   * Check health for a specific API
   */
  private async checkApiHealth(apiId: string, apiName: string, apiUrl: string): Promise<void> {
    try {
      // Fetch the API status
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Status-Ninja-Bot/1.0' }
      });
      
      const status = response.ok ? "healthy" : "unhealthy";
      const statusIcon = response.ok ? "✅" : "❌";
      const statusCode = response.status;
      
      // Get subscribed chat IDs for this API
      const chatIds = await this.apiService.getSubscribedChatIds(apiId);
          
      // Send notification to each chat
      for (const chatId of chatIds) {
        await this.notificationService.sendApiStatusNotification(
          chatId, 
          apiName, 
          apiUrl, 
          status, 
          statusIcon, 
          statusCode
        );
      }
    } catch (error) {
      console.error(`Error checking API ${apiName}:`, error);
      
      // Get subscribed chat IDs for this API to notify about the error
      const chatIds = await this.apiService.getSubscribedChatIds(apiId);
          
      // Send error notification to each chat
      for (const chatId of chatIds) {
        await this.notificationService.sendApiStatusNotification(
          chatId, 
          apiName, 
          apiUrl, 
          "error", 
          "❌", 
          0
        );
      }
    }
  }
} 