#!/usr/bin/env node

/**
 * PM2 Frontend Service Crash Handler
 * Sends Telegram alert when frontend service crashes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.ADMIN_CHAT_ID;
const hostname = require('os').hostname();
const timestamp = new Date().toISOString();

if (!botToken || !chatId) {
  console.error('Telegram credentials not configured');
  process.exit(0);
}

const message = `
⚠️ PM2 ALERT: Frontend Service CRASHED

Service: frontend (Next.js Web App)
Status: crashed
Hostname: ${hostname}
Timestamp: ${timestamp}

Action: PM2 will automatically restart the service.
Check logs: tail -f /opt/skilltree/logs/frontend-error.log
`.trim();

async function sendAlert(text) {
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

  return new Promise((resolve) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Alert sent');
        }
        resolve(true);
      });
    });

    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}

sendAlert(message).catch(() => {});
