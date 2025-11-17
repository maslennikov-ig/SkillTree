#!/usr/bin/env node

/**
 * PM2 API Service Crash Handler
 *
 * Triggered when API service crashes or exits abnormally
 * Sends alert notification via Telegram
 *
 * Usage:
 * Referenced in ecosystem.config.js:
 *   events: {
 *     exit: './scripts/pm2-handlers/api-crash.js',
 *     error: './scripts/pm2-handlers/api-crash.js'
 *   }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.ADMIN_CHAT_ID;
const hostname = require('os').hostname();
const timestamp = new Date().toISOString();

// Ensure Telegram credentials are configured
if (!botToken || !chatId) {
  console.error('Telegram credentials not configured (TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID)');
  process.exit(0); // Don't crash PM2 if Telegram config missing
}

// Get PM2 event data from environment or CLI arguments
const processName = process.env.pm_id ? `api-${process.env.pm_id}` : 'api';
const processStatus = process.argv[2] || 'crashed';

const message = `
⚠️ PM2 ALERT: API Service ${processStatus.toUpperCase()}

Service: api
Status: ${processStatus}
Hostname: ${hostname}
Timestamp: ${timestamp}
PID: ${process.pid}

Action: PM2 will automatically restart the service per ecosystem.config.js settings.
Check logs for details: tail -f /opt/skilltree/logs/api-error.log
`.trim();

/**
 * Send Telegram notification
 */
function sendTelegramAlert(text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Telegram alert sent successfully');
          resolve(true);
        } else {
          console.error(`Telegram API error: ${res.statusCode}`, responseData);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Failed to send Telegram alert:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// Send alert with retry logic (3 attempts, exponential backoff)
async function sendWithRetry(text, attempts = 0, maxAttempts = 3) {
  try {
    await sendTelegramAlert(text);
  } catch (error) {
    if (attempts < maxAttempts - 1) {
      const delayMs = Math.pow(2, attempts) * 1000; // 1s, 2s, 4s
      console.warn(`Retry attempt ${attempts + 1}/${maxAttempts - 1} after ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return sendWithRetry(text, attempts + 1, maxAttempts);
    }
    // Fail silently to not block PM2
    console.error(`Failed to send Telegram alert after ${maxAttempts} attempts`);
  }
}

// Send the alert
sendWithRetry(message).catch((err) => {
  console.error('Error in Telegram handler:', err.message);
});
