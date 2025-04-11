/**
 * Factory function for notification utilities
 */
export const createNotificationService = (botToken: string) => {
  /**
   * Send API status notification to a chat
   */
  const sendApiStatusNotification = async (
    chatId: number,
    apiName: string,
    apiUrl: string,
    status: string,
    statusIcon: string,
    statusCode: number
  ): Promise<void> => {
    // Format the timestamp using toUTCString for standard UTC format
    const timestamp = new Date().toUTCString();
    
    let statusText = `${statusIcon} ${status}`;
    if (statusCode > 0) {
      statusText += ` (HTTP ${statusCode})`;
    }
    
    const message = `Status Bot - API Health Check
API: ${apiName}
Status: ${statusText}
URL: ${apiUrl}
Time: ${timestamp}`;

    await sendTelegramMessage(chatId, message);
  };

  /**
   * Send a message to a Telegram chat
   */
  const sendTelegramMessage = async (
    chatId: number, 
    text: string, 
    parseMode?: 'Markdown' | 'HTML'
  ): Promise<void> => {
    console.log(`Sending message to chat ID: ${chatId}`);
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
          disable_notification: false
        })
      });
      
      interface TelegramResponse {
        ok: boolean;
        error_code?: number;
        description?: string;
        result?: Record<string, unknown>;
      }
      
      const responseData = await response.json() as TelegramResponse;
      
      if (!responseData.ok) {
        console.error(`Telegram error: ${responseData.description} (${responseData.error_code})`);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  };
  
  return {
    sendApiStatusNotification,
    sendTelegramMessage
  };
}; 