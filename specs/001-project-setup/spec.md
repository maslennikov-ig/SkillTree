# Feature Specification: Project Setup & Infrastructure

**Feature Branch**: `001-project-setup`
**Created**: 2025-01-17
**Status**: Draft
**Input**: "Phase 1.1: Project Setup & Infrastructure - Initialize VDS server, Supabase, Caddy, monorepo structure, and deployment pipeline"

## Clarifications

### Session 2025-01-17

- Q: Which monorepo tool should be used (Turborepo or Nx)? → A: Turborepo
- Q: What alerting mechanism should be used for production issues (deployment failures, server crashes, disk warnings)? → A: Telegram notifications (target chat/channel will be specified during implementation)
- Q: How should deployment rollback success be verified? → A: Call health endpoint and verify 200 OK response after rollback
- Q: Should PM2 use ecosystem.config.js file or CLI commands for process configuration? → A: Use ecosystem.config.js for declarative, version-controlled configuration
- Q: Should monorepo use TypeScript path aliases or workspace dependencies for cross-package imports? → A: Use workspace dependencies via package.json (e.g., @skilltree/shared) for better tooling compatibility
- Q: Should Git hooks be used for pre-commit quality checks? → A: Use Husky + lint-staged to run type-check and lint only on staged files before commit

## User Scenarios & Testing

### User Story 1 - Developer Environment Setup (Priority: P1)

As a developer, I need a working local development environment so that I can start building features for the SkillTree bot immediately after cloning the repository.

**Independent Test**: Clone the repository, run `pnpm install`, start dev server with `pnpm dev`, verify API starts without errors and health endpoint returns 200 OK.

**Acceptance Scenarios**:

1. **Given** fresh repository clone, **When** developer runs `pnpm install`, **Then** all dependencies install successfully without errors
2. **Given** dependencies installed, **When** developer runs `pnpm dev`, **Then** development server starts on configured port (API:4000). Note: Frontend and other apps will be added in future phases
3. **Given** dev server running, **When** developer opens http://localhost:4000/health, **Then** API returns 200 OK with status "healthy"
4. **Given** environment variables template exists, **When** developer copies .env.example to .env and fills required values, **Then** application connects to Supabase successfully

---

### User Story 2 - Database Schema Initialization (Priority: P1)

As a developer, I need the database schema ready with all tables and relationships so that I can start implementing features that store and retrieve data.

**Independent Test**: Run `pnpm db:push` command, verify Prisma schema applied to Supabase, check tables exist in Supabase Studio dashboard.

**Acceptance Scenarios**:

1. **Given** Supabase project created, **When** developer runs initial Prisma migration, **Then** all core tables (users, students, parents, test_sessions, questions, answers) are created
2. **Given** database schema applied, **When** developer queries Supabase, **Then** all foreign key relationships and constraints are properly enforced
3. **Given** schema changes made, **When** developer generates new migration, **Then** Prisma creates migration file with SQL diff
4. **Given** production database with existing data (future phases), **When** new migration deployed, **Then** data integrity is preserved and no data loss occurs. Note: For infrastructure phase (empty database), verify migration creates tables correctly and constraints prevent invalid data.

---

### User Story 3 - VDS Server Provisioning (Priority: P1)

As a DevOps engineer, I need a properly configured VDS server so that the application can run securely in production with automatic HTTPS and process management.

**Independent Test**: SSH into VDS server, verify Node.js, Caddy, Redis installed and running, check firewall rules with `ufw status`, confirm Caddy serves HTTPS on configured domains.

**Acceptance Scenarios**:

1. **Given** fresh Ubuntu 22.04 VDS, **When** initial setup script runs, **Then** Node.js 18+, Redis 7+, Caddy 2.x, and PM2 are installed and configured
2. **Given** Caddy configuration file created, **When** Caddy service starts, **Then** automatic HTTPS certificates are obtained from Let's Encrypt for all configured domains
3. **Given** firewall not configured, **When** UFW setup script runs, **Then** only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are allowed
4. **Given** Redis installed, **When** Redis service starts, **Then** Redis listens only on localhost:6379 with password authentication enabled

---

### User Story 4 - Continuous Deployment Pipeline (Priority: P2)

As a developer, I need automatic deployment when pushing to main branch so that new features reach production quickly without manual intervention.

**Independent Test**: Push commit to main branch, verify GitHub webhook triggers deployment, check PM2 restarts services, confirm new version live at production URL.

**Acceptance Scenarios**:

1. **Given** GitHub webhook configured, **When** push to main branch occurs, **Then** VDS receives webhook and triggers deployment script
2. **Given** deployment script running, **When** git pull completes, **Then** npm install, build, and Prisma migrations run automatically
3. **Given** build successful, **When** PM2 reload command executes, **Then** services restart with zero downtime (cluster mode)
4. **Given** deployment fails, **When** error detected, **Then** previous version rolls back automatically and admin receives Telegram notification

---

### User Story 5 - Monitoring and Logging (Priority: P3)

As an operations engineer, I need centralized logging and health monitoring so that I can quickly identify and debug production issues.

**Independent Test**: Generate test error, check PM2 logs show error details, verify Caddy access logs contain request information, test health endpoint returns system status.

**Acceptance Scenarios**:

1. **Given** application running, **When** health endpoint `/api/health` called, **Then** response includes status, uptime, database connection, and Redis connection status
2. **Given** error occurs, **When** application logs error, **Then** structured JSON log includes timestamp, level, message, stack trace, and request context
3. **Given** PM2 monitoring enabled, **When** viewing logs with `pm2 logs`, **Then** all application output (stdout/stderr) is captured and timestamped
4. **Given** Caddy access logs enabled, **When** request processed, **Then** log entry includes IP, method, path, status code, response time, and user agent

---

### Edge Cases

- What happens when **Supabase connection fails during startup**? Application should retry with exponential backoff (3 attempts) then exit with error code 1 and log detailed connection error.
- How does system handle **Redis unavailability**? Application should start in degraded mode (no rate limiting/caching) with warning logs, not block startup.
- What happens when **PM2 reload fails mid-deployment**? Deployment script should detect failure, rollback to previous git commit, restart services with old version, then verify rollback success by calling health endpoint and confirming 200 OK response.
- How does system handle **Let's Encrypt rate limit exceeded**? Caddy should use existing certificates and retry certificate renewal after exponential backoff.
- What happens when **disk space runs out on VDS**? Monitoring should send Telegram notification when disk usage exceeds 80%, logs should rotate daily, and old logs auto-delete after 7 days.
- How does system handle **SSH key authentication failure**? Server should log failed attempts, block IP after 3 failures (fail2ban), and send Telegram notification.

## Requirements

### Functional Requirements

- **FR-001**: System MUST support monorepo structure with separate packages for API, bot, frontend, admin, and shared code
- **FR-002**: System MUST use Turborepo for monorepo management with build caching, and cross-package imports MUST use workspace dependencies via package.json (e.g., import from '@skilltree/shared') rather than path aliases
- **FR-003**: System MUST connect to Supabase Cloud PostgreSQL using environment-provided connection string
- **FR-004**: System MUST use Prisma ORM with TypeScript for type-safe database access
- **FR-005**: System MUST initialize database schema with migrations for users, students, parents, parent_students, test_sessions, questions, and answers tables
- **FR-006**: System MUST provide pnpm scripts for common tasks: dev, build, test, db:push, db:migrate, type-check
- **FR-007**: VDS server MUST run Ubuntu 22.04 LTS with minimum 4GB RAM, 2 CPU cores, and 50GB SSD storage
- **FR-008**: VDS server MUST have Caddy 2.x configured as reverse proxy with automatic HTTPS for production domains. Domain structure: main domain (frontend), api.subdomain (API), admin.subdomain (admin dashboard). Note: Domain must be purchased and DNS configured before Caddy HTTPS setup - confirm domain name with project owner before VDS provisioning.
- **FR-009**: VDS server MUST have Redis 7+ installed, listening only on localhost with password authentication
- **FR-010**: VDS server MUST have UFW firewall configured to allow only SSH (22), HTTP (80), and HTTPS (443) ports
- **FR-011**: Deployment pipeline MUST trigger on push to main branch via GitHub webhook
- **FR-012**: Deployment script MUST execute: git pull, pnpm install, pnpm build, npx prisma migrate deploy, pm2 reload ecosystem.config.js
- **FR-013**: PM2 MUST run applications in cluster mode with at least 2 instances per service for zero-downtime restarts. For infrastructure phase: API service only (2 instances minimum). Future phases will add bot, frontend, admin services with their own instance configurations.
- **FR-014**: PM2 configuration MUST be defined in ecosystem.config.js file with process names, instance counts, environment variables, and restart policies
- **FR-015**: System MUST provide health check endpoint at /api/health returning JSON with status, uptime, database connection, and Redis connection
- **FR-016**: Application MUST use structured JSON logging with levels: error, warn, info, debug
- **FR-017**: System MUST rotate logs daily and delete logs older than 7 days to prevent disk space exhaustion
- **FR-018**: Environment variables MUST be loaded from .env file (never committed to git)
- **FR-019**: System MUST include .env.example file with all required variables and descriptive comments
- **FR-020**: TypeScript configuration MUST enable strict mode, noUncheckedIndexedAccess, and explicit return types
- **FR-021**: All packages MUST pass type-check (`tsc --noEmit`) before deployment
- **FR-022**: System MUST use Husky + lint-staged to run type-check and ESLint on staged files before each commit
- **FR-023**: System MUST send Telegram notifications for critical events using grammy library: deployment failures, PM2 process crashes, disk usage >80%, certificate renewal failures. Bot token and admin chat ID configured via environment variables (TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID)

### Key Entities

- **Monorepo Workspace**: Root package.json with workspace configuration using Turborepo workspaces, shared tooling (ESLint, Prettier, TypeScript), build orchestration, and cross-package dependencies via @skilltree/* scoped packages
- **API Package**: NestJS backend application with REST endpoints, Telegram webhook handler, business logic services
- **Bot Package**: Telegram bot service using grammY, conversation state management, message formatting
- **Database Package**: Prisma schema definitions, migration files, generated Prisma Client, database utilities
- **Shared Package**: Common TypeScript types, utility functions, constants, validation schemas (Zod)
- **VDS Server**: Ubuntu instance with Caddy, Redis, PM2, ecosystem.config.js, deployment scripts, monitoring tools (provider: FirstVDS)
- **PM2 Ecosystem Config**: ecosystem.config.js file defining all application processes with names, entry points, cluster mode settings, environment variables, and auto-restart policies
- **Supabase Project**: Managed PostgreSQL database, connection pooling, automatic backups, Row Level Security policies
- **GitHub Repository**: Version control, CI/CD workflows, webhook configuration, branch protection rules

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developer can clone repository and start local development within 5 minutes (install + first run)
- **SC-002**: Database schema initialization completes in under 30 seconds for empty database
- **SC-003**: VDS server provisioning (from fresh Ubuntu to production-ready) completes in under 20 minutes via automation script
- **SC-004**: Deployment pipeline (push to production live) completes in under 3 minutes including build and zero-downtime restart
- **SC-005**: Application restart during deployment causes zero dropped requests (PM2 cluster mode with graceful reload)
- **SC-006**: Health check endpoint responds in under 100ms with accurate database and Redis connection status
- **SC-007**: Application logs are structured JSON format, parseable by log aggregation tools, and include request correlation IDs
- **SC-008**: Caddy automatically obtains and renews HTTPS certificates for all domains without manual intervention
- **SC-009**: System handles 100 concurrent requests without errors during normal operation
- **SC-010**: Disk space usage stays under 80% through automatic log rotation (7-day retention)

### Business Value

- **BV-001**: Development team can start building features immediately after project setup (no waiting for infrastructure)
- **BV-002**: Production deployments are fast and reliable, enabling multiple releases per day if needed
- **BV-003**: Zero-downtime deployments prevent service interruptions during peak usage hours
- **BV-004**: Automatic HTTPS ensures user data security and builds trust (security indicator in browser)
- **BV-005**: Structured logging enables quick debugging, reducing mean time to resolution (MTTR) for production issues

## Dependencies & Assumptions

### External Dependencies

- **FirstVDS**: VDS server provider, assuming 99.9% uptime SLA, assuming Ubuntu 22.04 LTS available
- **Supabase**: Database provider, assuming free tier sufficient for MVP (500MB storage, 50k MAU), assuming EU region available for GDPR compliance
- **GitHub**: Version control and CI/CD, assuming GitHub Actions free tier sufficient for build pipelines
- **Let's Encrypt**: TLS certificates via Caddy, assuming rate limits not exceeded (50 certs per domain per week)
- **npm Registry**: Package distribution, assuming availability and no breaking changes in dependencies

### Assumptions

- Developers have Node.js 18+ installed locally for development
- Team has basic familiarity with TypeScript, Prisma, and monorepo concepts
- VDS server has public IP address and domain names already configured in DNS (domain purchase and DNS setup required before deployment)
- Supabase project created manually before running initial migration (project URL and keys provided in .env)
- GitHub repository has webhook secrets configured for deployment automation
- Team uses Git flow with main branch as production and feature branches for development
- Redis used only for caching and rate limiting, not for critical data persistence
- Application designed for vertical scaling first (upgrade VDS specs), horizontal scaling (multiple servers) considered for future if needed

### Technical Constraints

- Turborepo adds complexity but necessary for code sharing between packages
- Caddy automatic HTTPS requires domain pointing to server IP before first startup (chicken-egg problem: manual DNS setup needed first)
- Zero-downtime deployment requires at least 2GB RAM for PM2 cluster mode (old + new instances briefly coexist during reload)
- Supabase connection pooling may require Prisma connection pool tuning for optimal performance under load
- PM2 process management requires persistent storage for process list (cannot run in fully ephemeral container environment without configuration)

## Out of Scope

- **Load balancing across multiple VDS servers** (future enhancement when single server capacity exceeded)
- **Automated VDS provisioning via Terraform/Ansible** (manual server setup acceptable for MVP, automation later)
- **Advanced monitoring with Grafana/Prometheus** (basic health checks and logs sufficient initially)
- **Blue-green or canary deployments** (single-server deployment simpler, advanced strategies considered later)
- **Automated database backup verification** (rely on Supabase automatic backups, custom backup testing future enhancement)
- **Infrastructure as Code (IaC) for all configuration** (manual Caddy and PM2 configuration acceptable initially)
- **Multi-region deployment** (single EU region sufficient for Russian market, multi-region considered for global expansion)
- **Advanced security hardening beyond UFW and SSH keys** (intrusion detection systems, DDoS protection future enhancements)

## Future Phases (Post-Infrastructure)

**Note**: Infrastructure phase (001-project-setup) implements only the API package and foundational services. The following packages will be added in subsequent feature implementations:

- **Bot Package (apps/bot/)**: Telegram bot implementation using grammy for conversation management, command handling, and user interactions
- **Frontend Package (apps/frontend/)**: Next.js-based Telegram Web App for rich user interface within Telegram
- **Admin Package (apps/admin/)**: Admin dashboard for managing students, test sessions, and viewing analytics

These packages are referenced in the monorepo structure and configuration files but have no implementation tasks in this infrastructure phase.

## Non-Functional Requirements

### Performance

- API health check endpoint must respond within 100ms
- Application startup time must not exceed 10 seconds from PM2 start to accepting requests
- Database migrations must complete within 30 seconds for schema with up to 100,000 rows
- Build process (npm run build) must complete within 5 minutes for full monorepo

### Reliability

- Application must restart automatically if crashed (PM2 auto-restart enabled)
- Deployment must rollback automatically if new version fails health check within 30 seconds, then verify rollback success with health endpoint 200 OK response
- System must handle graceful shutdown, completing in-flight requests before terminating
- Database connection pool must retry failed connections with exponential backoff (max 3 attempts)

### Observability

- Application logs must be structured JSON format with timestamp, level, message, stack trace, request context
- Health check endpoint must expose status, uptime, database connectivity, Redis connectivity
- PM2 must capture all stdout/stderr output with timestamps
- Caddy access logs must include IP, method, path, status code, response time, user agent
- System must send Telegram notifications for critical events: deployment failures, PM2 crashes, disk >80%, certificate renewal failures
- Telegram notification target (chat/channel ID) will be specified in environment variables during implementation

### Security

- All secrets must be stored in environment variables, never in code or configuration files
- SSH access must use key-based authentication only (password auth disabled)
- Redis must listen only on localhost (no external access)
- Database connection string must use SSL/TLS for encryption in transit
- UFW firewall must drop all incoming traffic except SSH, HTTP, HTTPS

### Maintainability

- Code must pass TypeScript strict mode checks before deployment
- Git pre-commit hooks (Husky + lint-staged) must enforce type-check and ESLint on staged files to catch issues early
- All configuration files must include comments explaining purpose and default values
- Deployment scripts must log all steps with timestamps for debugging
- Monorepo packages must have clear separation of concerns (API, bot, shared utilities)
- Documentation must include setup instructions for new developers (README.md in root)

### Scalability

- System must support at least 100 concurrent users on MVP VDS specs (4GB RAM, 2 CPU)
- Database schema must use indexed foreign keys for efficient joins
- Redis must cache frequently accessed data to reduce database load
- PM2 cluster mode must distribute load across CPU cores
- Application must be designed for eventual horizontal scaling (stateless where possible)

## Risks & Mitigations

### Risk 1: Supabase Free Tier Limits Exceeded

**Impact**: High - Application cannot accept new users if database storage or MAU limits reached

**Likelihood**: Medium - Depends on early user growth, free tier limits: 500MB storage, 50k MAU

**Mitigation**:
- Monitor Supabase dashboard for usage metrics weekly
- Set up Telegram notifications at 80% of storage and MAU limits
- Plan upgrade to Pro tier ($25/month) if approaching limits
- Implement data retention policy (e.g., delete test sessions older than 90 days) to manage storage

### Risk 2: Let's Encrypt Rate Limits Hit During Development

**Impact**: Medium - HTTPS certificates cannot be renewed, users see security warnings

**Likelihood**: Low if using staging environment, Medium if testing on production domains frequently

**Mitigation**:
- Use Let's Encrypt staging server for development/testing (different rate limits)
- Test Caddy configuration with local self-signed certificates before production
- Keep existing certificates backed up for manual restoration if needed
- Implement certificate expiry monitoring (send Telegram notification 7 days before expiration)

### Risk 3: Single VDS Server Becomes Single Point of Failure

**Impact**: High - Entire application unavailable if server crashes or network issues

**Likelihood**: Low with 99.9% VDS provider SLA, but still possible (maintenance, hardware failure)

**Mitigation**:
- Document disaster recovery procedure (restore from Supabase backup to new server)
- Keep complete server setup scripts in repository for rapid reprovisioning
- Monitor uptime with external service (e.g., UptimeRobot) for instant failure notification
- Plan for multi-server setup in future phase if uptime becomes critical business requirement

### Risk 4: Monorepo Complexity Slows New Developer Onboarding

**Impact**: Medium - New developers take longer to understand project structure and start contributing

**Likelihood**: Medium - Monorepos add abstraction layer compared to single-repo projects

**Mitigation**:
- Provide detailed README with architecture diagrams and package relationships
- Create developer onboarding checklist with clear steps (clone, install, start dev server, run tests)
- Record video walkthrough of project structure and common development tasks
- Use consistent naming and folder structure across all packages (src/, tests/, dist/)

### Risk 5: PM2 Deployment Fails Mid-Process Leaving Application in Broken State

**Impact**: High - Production application down until manual intervention

**Likelihood**: Low - PM2 reload designed for zero-downtime, but errors possible (build failures, migrations fail)

**Mitigation**:
- Implement pre-deployment health check (test build, test migrations on staging DB)
- Add automatic rollback in deployment script if new version fails health check within 30 seconds
- After rollback, verify success by calling health endpoint and confirming 200 OK response
- Keep previous build artifacts for rapid manual rollback if automated rollback fails
- Send Telegram notification immediately on deployment or rollback failures

---

**Status**: Ready for validation
**Next Steps**: Validate specification quality, then proceed to `/speckit.plan`
