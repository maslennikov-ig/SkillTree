/**
 * PM2 Ecosystem Configuration for SkillTree Production
 *
 * Purpose:
 *   - Manage all Node.js services with zero-downtime deployments
 *   - Run services in cluster mode for high availability
 *   - Enable graceful shutdown and reload
 *
 * Services:
 *   1. api       - NestJS REST API (port 4000)
 *   2. bot       - Telegram bot (grammY)
 *   3. frontend  - Next.js Telegram Web App (port 3000)
 *   4. admin     - Next.js Admin Dashboard (port 3001)
 *
 * Usage:
 *   - Start all services:  pm2 start ecosystem.config.js
 *   - Reload services:     pm2 reload ecosystem.config.js (zero-downtime)
 *   - Restart services:    pm2 restart ecosystem.config.js
 *   - Stop services:       pm2 stop ecosystem.config.js
 *   - View logs:           pm2 logs [app-name]
 *   - Monitor:             pm2 monit
 *   - Status:              pm2 status
 *
 * Zero-Downtime Deployment:
 *   pm2 reload uses cluster mode to:
 *   1. Start new instances with updated code
 *   2. Wait for new instances to send 'ready' signal
 *   3. Gracefully shutdown old instances
 *   4. No dropped requests during deployment
 *
 * Prerequisites:
 *   - Application built: pnpm build
 *   - Environment variables in .env file
 *   - PM2 installed globally: npm install -g pm2
 *
 * @see https://pm2.keymetrics.io/docs/usage/cluster-mode/
 * @see https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
 */

module.exports = {
  apps: [
    /**
     * API Service (NestJS)
     *
     * Description: REST API backend for SkillTree platform
     * Port: 4000 (reverse proxied via Caddy at api.skilltree.app)
     * Instances: 2 (minimum for zero-downtime reloads)
     *
     * Key Features:
     *   - Cluster mode for load distribution
     *   - Graceful shutdown with 5s timeout
     *   - Health check integration via wait_ready
     *   - Database connection with retry logic
     *
     * Tasks Implemented:
     *   - T074: PM2 ecosystem configuration created
     *   - T075: API process configured with cluster mode (2 instances)
     *   - T076: Production environment variables (NODE_ENV, PORT)
     *   - T077: Graceful shutdown (wait_ready, listen_timeout, kill_timeout)
     *   - T127: Log rotation (max_size: 10M, retain: 7)
     */
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',

      // Graceful shutdown (T077)
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Environment variables (T076)
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // Logging with rotation (T127)
      log_file: '/opt/skilltree/logs/api-combined.log',
      out_file: '/opt/skilltree/logs/api-out.log',
      error_file: '/opt/skilltree/logs/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_size: '10M',
      retain: 7,

      // Auto restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // TODO (T127.5): Configure PM2 crash webhook for Telegram notifications
      // PM2 does not support webhooks natively in ecosystem.config.js
      // Implement using PM2 Module or external monitoring script
      // See: https://pm2.keymetrics.io/docs/usage/pm2-api/
      // Alternative: Use pm2-slack or custom event handler
    },

    // Future services (add when ready):
    // {
    //   name: 'bot',
    //   script: './apps/bot/dist/main.js',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   ...
    // },
    // {
    //   name: 'frontend',
    //   script: './apps/frontend/.next/standalone/server.js',
    //   instances: 2,
    //   exec_mode: 'cluster',
    //   ...
    // },
    // {
    //   name: 'admin',
    //   script: './apps/admin/.next/standalone/server.js',
    //   instances: 2,
    //   exec_mode: 'cluster',
    //   ...
    // }
  ],
};

/**
 * APPLICATION CODE REQUIREMENTS
 *
 * For zero-downtime reloads to work, application code MUST:
 *
 * 1. Send 'ready' signal after server starts:
 *
 *    // NestJS example (apps/api/src/main.ts)
 *    async function bootstrap() {
 *      const app = await NestFactory.create(AppModule);
 *      await app.listen(process.env.PORT || 4000);
 *
 *      // Send ready signal to PM2
 *      if (process.send) {
 *        process.send('ready');
 *      }
 *    }
 *
 * 2. Handle graceful shutdown on SIGINT:
 *
 *    process.on('SIGINT', async () => {
 *      console.log('Received SIGINT, graceful shutdown...');
 *      await app.close();
 *      await prisma.$disconnect();
 *      process.exit(0);
 *    });
 *
 * 3. Keep connections alive during reload:
 *    - Database: use connection pooling
 *    - Redis: reconnect on disconnect
 *    - HTTP: set keep-alive headers
 *
 * @see apps/api/src/main.ts for NestJS implementation example
 */

/**
 * TROUBLESHOOTING
 *
 * 1. App won't start:
 *    - Check logs: pm2 logs [app-name]
 *    - Verify build: ls -la apps/api/dist/
 *    - Check environment: cat .env
 *
 * 2. "Ready timeout" errors:
 *    - Increase listen_timeout (default 10s)
 *    - Ensure app calls process.send('ready')
 *    - Check for blocking operations in startup
 *
 * 3. Memory leaks:
 *    - Monitor: pm2 monit
 *    - Adjust max_memory_restart threshold
 *    - Check for unclosed connections
 *
 * 4. Cluster mode issues:
 *    - Ensure app is stateless (no in-memory session)
 *    - Use Redis for shared state
 *    - Verify load balancing works: curl multiple times
 *
 * 5. Graceful reload not working:
 *    - Verify SIGINT handler implemented
 *    - Check kill_timeout (increase if shutdown slow)
 *    - Look for blocking cleanup operations
 */

/**
 * PM2 STARTUP CONFIGURATION
 *
 * To start PM2 services on server boot:
 *
 * 1. Generate startup script:
 *    pm2 startup systemd
 *
 * 2. Copy and run the generated command (as root)
 *
 * 3. Start services and save configuration:
 *    pm2 start ecosystem.config.js
 *    pm2 save
 *
 * 4. Verify startup works:
 *    sudo reboot
 *    # After reboot:
 *    pm2 status  # Should show all services running
 *
 * 5. Remove startup (if needed):
 *    pm2 unstartup systemd
 */
