import { Database } from '../db';
import { createApiService } from './api-service';
import { createNotificationService } from './notification-service';

/**
 * Factory function for health check operations
 */
export const createHealthCheckService = (
  db: Database,
  botToken: string
) => {
  const apiService = createApiService(db);
  const notificationService = createNotificationService(botToken);
  
  /**
   * Check health for a specific API
   */
  const checkApiHealth = async (apiId: string, apiName: string, apiUrl: string): Promise<void> => {
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
      const chatIds = await apiService.getSubscribedChatIds(apiId);
          
      // Send notification to each chat
      for (const chatId of chatIds) {
        await notificationService.sendApiStatusNotification(
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
      const chatIds = await apiService.getSubscribedChatIds(apiId);
          
      // Send error notification to each chat
      for (const chatId of chatIds) {
        await notificationService.sendApiStatusNotification(
          chatId, 
          apiName, 
          apiUrl, 
          "error", 
          "❌", 
          0
        );
      }
    }
  };

  /**
   * Run health check for all APIs
   */
  const runHealthCheckForAllApis = async (): Promise<void> => {
    try {
      // Get all APIs
      const apis = await apiService.listApis();
      
      // Check each API
      for (const api of apis) {
        await checkApiHealth(api.id, api.name, api.url);
      }
    } catch (error) {
      console.error('Error running health check:', error);
    }
  };
  
  return {
    runHealthCheckForAllApis,
    checkApiHealth
  };
}; 