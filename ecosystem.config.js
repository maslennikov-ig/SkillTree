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
     */
    {
      name: 'api',
      script: './apps/api/dist/main.js',

      // Cluster mode: run 2 instances for zero-downtime
      instances: 2,
      exec_mode: 'cluster',

      // Graceful reload: wait for 'ready' signal before considering app started
      // Application MUST call process.send('ready') after server.listen()
      wait_ready: true,
      listen_timeout: 10000,  // Max 10s to wait for ready signal
      kill_timeout: 5000,     // Max 5s for graceful shutdown (SIGINT)

      // Environment variables (override with .env file)
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },

      // Log configuration with rotation
      error_file: '/opt/skilltree/logs/api-error.log',
      out_file: '/opt/skilltree/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_size: '10M',        // Rotate log when it reaches 10MB
      retain: 7,              // Keep 7 rotated log files (7 days)

      // Auto-restart on crash (max 10 restarts in 1 minute before giving up)
      max_restarts: 10,
      min_uptime: '10s',

      // Memory monitoring (restart if exceeds 500MB)
      max_memory_restart: '500M',

      // Process event handlers for monitoring
      events: {
        exit: 'scripts/pm2-handlers/api-crash.js',
        error: 'scripts/pm2-handlers/api-crash.js'
      }
    },

    /**
     * Telegram Bot Service (grammY)
     *
     * Description: Telegram bot for user interactions
     * Port: N/A (uses long polling to Telegram API)
     * Instances: 1 (Telegram bot polling must be singleton)
     *
     * IMPORTANT: Only 1 instance allowed for bot due to Telegram API limitations
     * Multiple instances will cause "Conflict: terminated by other getUpdates" error
     */
    {
      name: 'bot',
      script: './apps/bot/dist/main.js',

      // Fork mode: only 1 instance (Telegram bot limitation)
      instances: 1,
      exec_mode: 'fork',

      // Graceful reload
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Environment variables
      env: {
        NODE_ENV: 'production'
      },

      // Log configuration with rotation
      error_file: '/opt/skilltree/logs/bot-error.log',
      out_file: '/opt/skilltree/logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_size: '10M',        // Rotate log when it reaches 10MB
      retain: 7,              // Keep 7 rotated log files

      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',

      // Process event handlers for monitoring
      events: {
        exit: 'scripts/pm2-handlers/bot-crash.js',
        error: 'scripts/pm2-handlers/bot-crash.js'
      }
    },

    /**
     * Frontend Service (Next.js)
     *
     * Description: Telegram Web App for students/parents
     * Port: 3000 (reverse proxied via Caddy at skilltree.app)
     * Instances: 2 (for zero-downtime)
     *
     * Note: Requires Next.js standalone build
     * Build command: next build (with output: 'standalone' in next.config.js)
     */
    {
      name: 'frontend',
      script: './apps/frontend/.next/standalone/server.js',

      // Cluster mode: 2 instances
      instances: 2,
      exec_mode: 'cluster',

      // Graceful reload
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Next.js requires HOSTNAME for standalone server
        HOSTNAME: '0.0.0.0'
      },

      // Log configuration with rotation
      error_file: '/opt/skilltree/logs/frontend-error.log',
      out_file: '/opt/skilltree/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_size: '10M',        // Rotate log when it reaches 10MB
      retain: 7,              // Keep 7 rotated log files

      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '400M',

      // Process event handlers for monitoring
      events: {
        exit: 'scripts/pm2-handlers/frontend-crash.js',
        error: 'scripts/pm2-handlers/frontend-crash.js'
      }
    },

    /**
     * Admin Dashboard Service (Next.js)
     *
     * Description: Admin panel for managing platform
     * Port: 3001 (reverse proxied via Caddy at admin.skilltree.app)
     * Instances: 2 (for zero-downtime)
     *
     * Note: Requires Next.js standalone build
     */
    {
      name: 'admin',
      script: './apps/admin/.next/standalone/server.js',

      // Cluster mode: 2 instances
      instances: 2,
      exec_mode: 'cluster',

      // Graceful reload
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0'
      },

      // Log configuration with rotation
      error_file: '/opt/skilltree/logs/admin-error.log',
      out_file: '/opt/skilltree/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_size: '10M',        // Rotate log when it reaches 10MB
      retain: 7,              // Keep 7 rotated log files

      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',

      // Process event handlers for monitoring
      events: {
        exit: 'scripts/pm2-handlers/admin-crash.js',
        error: 'scripts/pm2-handlers/admin-crash.js'
      }
    }
  ],

  /**
   * Deployment Configuration (Optional)
   *
   * Enables PM2 deploy via SSH for remote deployments
   *
   * Usage:
   *   pm2 deploy ecosystem.config.js production setup
   *   pm2 deploy ecosystem.config.js production update
   *
   * Note: This is OPTIONAL - current deployment uses GitHub webhooks
   */
  deploy: {
    production: {
      // SSH user and host
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/repa-maks.git',
      path: '/opt/skilltree/repa-maks',

      // Post-deploy commands
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.js && pm2 save',

      // Environment variables for deployment
      env: {
        NODE_ENV: 'production'
      }
    }
  }
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
