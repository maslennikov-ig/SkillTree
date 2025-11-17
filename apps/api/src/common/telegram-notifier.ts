import { Bot } from 'grammy';

/**
 * Telegram notification service for critical system alerts
 * Sends notifications to admin chat for deployment failures, crashes, etc.
 */
export class TelegramNotifier {
  private bot: Bot | null = null;
  private adminChatId: string | null = null;
  private initialized = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;

    if (!token || !chatId) {
      console.warn(
        '⚠️  Telegram credentials missing (TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID) - notifications disabled',
      );
      return;
    }

    try {
      this.bot = new Bot(token);
      this.adminChatId = chatId;
      this.initialized = true;
      console.log('✅ Telegram notifier initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram notifier:', error);
    }
  }

  /**
   * Send alert message to admin chat with automatic retry logic
   * @param message - Alert message to send
   */
  async sendAlert(message: string): Promise<void> {
    if (!this.initialized || !this.bot || !this.adminChatId) {
      console.warn(
        '⚠️  Telegram notifier not initialized - skipping alert:',
        message,
      );
      return;
    }

    // Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
    const retryDelays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.bot.api.sendMessage(this.adminChatId, message, {
          parse_mode: 'Markdown',
        });
        console.log(`✅ Telegram alert sent successfully (attempt ${attempt + 1})`);
        return;
      } catch (error) {
        const isLastAttempt = attempt === 2;
        if (isLastAttempt) {
          console.error(
            '❌ Telegram alert failed after 3 retries:',
            error,
          );
          return;
        }
        console.warn(
          `⚠️  Telegram attempt ${attempt + 1} failed, retrying in ${retryDelays[attempt]}ms...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelays[attempt]),
        );
      }
    }
  }
}

// Export singleton instance
export const telegramNotifier = new TelegramNotifier();
