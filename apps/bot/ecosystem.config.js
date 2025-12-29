/**
 * PM2 Ecosystem Configuration for SkillTree Bot
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart skilltree-bot
 *   pm2 logs skilltree-bot
 */

module.exports = {
  apps: [
    // Main Bot Process
    {
      name: "skilltree-bot",
      script: "./dist/bot.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      // Logging configuration
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/opt/skilltree/logs/bot-error.log",
      out_file: "/opt/skilltree/logs/bot-out.log",
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 1000,
      max_restarts: 10,
      min_uptime: "10s",
    },

    // Weekly Data Anonymization Cron Job (FR-039)
    // Runs every Sunday at 3:00 AM Moscow time (00:00 UTC)
    // Processes users with expired 3-year retention period
    {
      name: "skilltree-anonymize-cron",
      script: "npx",
      args: "ts-node ../../packages/database/prisma/scripts/anonymize-users.ts --limit=100",
      cwd: "/opt/skilltree/current/apps/bot",
      instances: 1,
      exec_mode: "fork",
      autorestart: false, // One-shot job
      watch: false,
      cron_restart: "0 0 * * 0", // Every Sunday at 00:00 UTC (03:00 Moscow)
      env: {
        NODE_ENV: "production",
      },
      // Logging configuration
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/opt/skilltree/logs/anonymize-error.log",
      out_file: "/opt/skilltree/logs/anonymize-out.log",
      merge_logs: true,
    },

    // Daily Retention Check (FR-038 compliance audit)
    // Runs daily at 4:00 AM Moscow time (01:00 UTC)
    // Reports expired users for monitoring
    {
      name: "skilltree-retention-check",
      script: "npx",
      args: "ts-node ../../packages/database/prisma/scripts/check-retention.ts --json",
      cwd: "/opt/skilltree/current/apps/bot",
      instances: 1,
      exec_mode: "fork",
      autorestart: false, // One-shot job
      watch: false,
      cron_restart: "0 1 * * *", // Every day at 01:00 UTC (04:00 Moscow)
      env: {
        NODE_ENV: "production",
      },
      // Logging configuration
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/opt/skilltree/logs/retention-check-error.log",
      out_file: "/opt/skilltree/logs/retention-check-out.log",
      merge_logs: true,
    },
  ],
};
