import { Bot } from "grammy";

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
        "⚠️  Telegram credentials missing (TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID) - notifications disabled",
      );
      return;
    }

    try {
      this.bot = new Bot(token);
      this.adminChatId = chatId;
      this.initialized = true;
      console.log("✅ Telegram notifier initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Telegram notifier:", error);
    }
  }

  /**
   * Send alert message to admin chat with automatic retry logic
   * @param message - Alert message to send
   */
  async sendAlert(message: string): Promise<void> {
    if (!this.initialized || !this.bot || !this.adminChatId) {
      console.warn(
        "⚠️  Telegram notifier not initialized - skipping alert:",
        message,
      );
      return;
    }

    // Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
    const retryDelays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.bot.api.sendMessage(this.adminChatId, message, {
          parse_mode: "HTML",
        });
        console.log(
          `✅ Telegram alert sent successfully (attempt ${attempt + 1})`,
        );
        return;
      } catch (error) {
        const isLastAttempt = attempt === 2;
        if (isLastAttempt) {
          console.error("❌ Telegram alert failed after 3 retries:", error);
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

  /**
   * Format deployment success message
   * @param commitId - Git commit SHA
   * @param commitMessage - Commit message
   * @returns Formatted Telegram message
   */
  formatDeploymentSuccess(commitId: string, commitMessage: string): string {
    return (
      `<b>✅ Deployment Successful</b>\n\n` +
      `<b>Commit:</b> <code>${commitId.substring(0, 7)}</code>\n` +
      `<b>Message:</b> ${commitMessage}\n` +
      `<b>Time:</b> ${new Date().toISOString()}\n\n` +
      `All services are healthy and running.`
    );
  }

  /**
   * Format deployment failure message
   * @param error - Error message
   * @param commitId - Git commit SHA
   * @returns Formatted Telegram message
   */
  formatDeploymentFailure(error: string, commitId?: string): string {
    let message =
      `<b>❌ Deployment Failed</b>\n\n` +
      `<b>Error:</b> ${error}\n` +
      `<b>Time:</b> ${new Date().toISOString()}\n\n` +
      `Check logs at /opt/skilltree/logs/ for details.`;

    if (commitId) {
      message =
        `<b>Commit:</b> <code>${commitId.substring(0, 7)}</code>\n\n` + message;
    }

    return message;
  }

  /**
   * Format rollback notification message
   * @param commitId - Git commit SHA being rolled back to
   * @returns Formatted Telegram message
   */
  formatRollbackNotification(commitId: string): string {
    return (
      `<b>⚠️ Automatic Rollback Triggered</b>\n\n` +
      `<b>Rolled back to:</b> <code>${commitId.substring(0, 7)}</code>\n` +
      `<b>Time:</b> ${new Date().toISOString()}\n\n` +
      `Services have been restored to previous version.`
    );
  }

  /**
   * Format process crash notification
   * @param processName - Name of crashed process
   * @param error - Error message
   * @returns Formatted Telegram message
   */
  formatProcessCrash(processName: string, error: string): string {
    return (
      `<b>🔴 Process Crash Alert</b>\n\n` +
      `<b>Process:</b> ${processName}\n` +
      `<b>Error:</b> ${error}\n` +
      `<b>Time:</b> ${new Date().toISOString()}\n\n` +
      `Check PM2 logs: <code>pm2 logs ${processName}</code>`
    );
  }

  /**
   * Format disk space warning
   * @param diskUsagePercent - Disk usage percentage
   * @returns Formatted Telegram message
   */
  formatDiskSpaceWarning(diskUsagePercent: number): string {
    return (
      `<b>⚠️ Disk Space Warning</b>\n\n` +
      `<b>Usage:</b> ${diskUsagePercent}%\n` +
      `<b>Time:</b> ${new Date().toISOString()}\n\n` +
      `Disk usage is above 80%. Consider cleaning up old logs.`
    );
  }
}

// Export singleton instance
export const telegramNotifier = new TelegramNotifier();
