<!--
Sync Impact Report
==================
Version Change: 1.0.0 → 2.0.0
Modified Principles:
- Technology Standards → Complete rewrite for SkillTree stack (MAJOR)
- Project name change: Symancy → SkillTree (MAJOR)
Added Sections:
- Telegram Bot Development Standards
- OpenRouter AI Integration Standards
- Russian Market Compliance
Removed Sections: None

Templates Requiring Updates:
✅ plan-template.md - Constitution Check section references this file
✅ spec-template.md - Aligned with SkillTree requirements
✅ tasks-template.md - Task organization matches constitution
✅ CLAUDE.md - Root orchestration rules reference constitution

Follow-up TODOs: None - all placeholders resolved
-->

# SkillTree Project Constitution

**Project**: SkillTree - AI-Powered Career Guidance Telegram Bot
**Domain**: EdTech, Career Guidance, Lead Generation
**Target Market**: Russian Federation (students 14-18 years old)

## Core Principles

### I. Context-First Development

Every feature implementation MUST begin with comprehensive context gathering before any code is written or delegated. This principle is NON-NEGOTIABLE.

**Requirements:**
- Read existing code in related files
- Search codebase for similar patterns and implementations
- Review relevant documentation files (specs, design docs, ADRs)
- Check recent commits that touched related areas
- Understand dependencies and integration points
- Review Telegram Bot API documentation for bot-specific features

**Rationale:** Context-first prevents duplicate work, ensures consistency with existing patterns, and prevents conflicting approaches. Blind implementation or delegation leads to rework and technical debt. For Telegram bots, understanding bot API limitations and best practices is critical.

### II. Agent-Based Orchestration

Complex tasks MUST be delegated to specialized subagents. The orchestrator coordinates but does not implement beyond minimal changes.

**Requirements:**
- Provide complete context to subagents (code snippets, file paths, patterns, documentation references)
- Specify exact expected output and validation criteria
- Verify results after subagent completes (read modified files, run type-check)
- Re-delegate with corrections if results incorrect
- Only execute directly for trivial tasks (single-line fixes, simple imports, minimal configuration)

**Rationale:** Specialized agents produce higher quality results in their domain. Orchestrator maintains oversight while leveraging specialized expertise.

### III. Test-Driven Development (Conditional)

When tests are specified in feature requirements, Test-Driven Development (TDD) is MANDATORY. Tests MUST be written first, verified to fail, then implementation proceeds.

**Requirements:**
- Write tests BEFORE implementation
- Verify tests FAIL before implementing
- Follow Red-Green-Refactor cycle
- Tests MUST be independently verifiable for each user story
- Telegram webhook handlers MUST have integration tests

**Rationale:** TDD ensures requirements are testable, prevents over-engineering, and provides immediate validation of implementation correctness. Telegram bots require robust testing due to asynchronous nature.

**Note:** Tests are OPTIONAL by default. Only when explicitly requested in feature specifications does this principle activate.

### IV. Atomic Task Execution

Each task MUST be independently completable, testable, and committable. Tasks are completed one at a time with immediate validation.

**Requirements:**
- Mark task in_progress BEFORE starting
- Verify implementation (read files + run type-check)
- Mark task completed IMMEDIATELY after validation
- Update tasks.md with [X] and artifacts
- Commit with `/push patch` after EACH task
- Move to next task only after current task validated

**Rationale:** Atomic commits provide detailed history, easy rollback, better code review, and clear progress tracking. Batching hides granularity and complicates debugging.

### V. User Story Independence

Features MUST be decomposed into independently testable user stories. Each user story delivers standalone value and can be deployed independently.

**Requirements:**
- Prioritize user stories (P1, P2, P3...)
- Each story MUST be independently implementable
- Each story MUST be independently testable
- Each story MUST deliver measurable value
- Foundation phase MUST complete before any user story work begins

**Rationale:** Independent user stories enable incremental delivery, parallel development, and risk reduction. MVP can be delivered with just P1 story.

### VI. Quality Gates (NON-NEGOTIABLE)

Type-check and build MUST pass before any commit. No exceptions.

**Requirements:**
- Run type-check after implementation
- Run build verification
- No hardcoded credentials (Telegram tokens, API keys)
- No TODO comments without issue references
- Prisma migrations MUST be tested before deploy

**Rationale:** Quality gates prevent broken code from entering main branch, reduce debugging time, and maintain codebase health. Telegram bots require extra caution with credentials.

### VII. Progressive Specification

Features progress through mandatory specification phases before implementation. Each phase builds upon previous validated artifacts.

**Requirements:**
- Phase 0: Specification (spec.md with user stories)
- Phase 1: Planning (plan.md with technical approach)
- Phase 2: Task Generation (tasks.md organized by user stories)
- Phase 3: Implementation (execute tasks atomically)
- No phase can be skipped
- Each phase output MUST be validated before proceeding

**Rationale:** Progressive specification reduces rework, ensures shared understanding, and validates approach before expensive implementation.

## Security Requirements

### Data Protection

All user data MUST comply with 152-ФЗ (Russian Federal Law on Personal Data) and GDPR where applicable.

**Requirements:**
- No hardcoded credentials in code
- Use environment variables for secrets (.env files, never committed)
- Supabase RLS policies for data access control
- Audit logs for sensitive operations (parent contact data access)
- Phone number encryption/hashing for fraud detection
- Telegram user IDs stored securely
- Parent email addresses encrypted at rest

**Russian Compliance:**
- Store personal data of Russian citizens in Russia or Supabase EU region
- Implement data deletion requests (right to be forgotten)
- Maintain audit trail for data access

### Authentication & Authorization

All API endpoints MUST enforce authentication. Admin panel MUST use Supabase Auth.

**Requirements:**
- Telegram Bot authentication via user ID verification
- Supabase Auth for admin panel
- Implement RLS policies for data isolation
- Session management via Supabase
- No custom auth implementations without justification
- Webhook validation (Telegram secret token)

### API Security

**OpenRouter API:**
- API keys stored in environment variables only
- Rate limiting to prevent abuse
- Cost monitoring and budget alerts
- Token usage tracking per user

**Telegram Bot API:**
- Webhook secret token validation
- Rate limiting (prevent spam)
- Input sanitization (SQL injection, XSS prevention)

## Technology Standards

### Core Stack

**Backend:**
- **Runtime**: Node.js 18+ with TypeScript 5+
- **Framework**: NestJS (recommended) or Express
- **Telegram**: grammY (recommended) or node-telegram-bot-api
- **Database**: PostgreSQL 15+ (Supabase Cloud)
- **ORM**: Prisma (primary) or TypeORM
- **Auth**: Supabase Auth for admin panel
- **Process Manager**: PM2 (cluster mode)

**Frontend (Telegram Web App):**
- **Framework**: React 18+ / Next.js 14+
- **Language**: TypeScript 5+
- **Telegram SDK**: @twa-dev/sdk
- **State**: Zustand or Redux Toolkit
- **Styling**: Tailwind CSS + shadcn/ui
- **Build**: Vite or Next.js

**AI/ML:**
- **Primary**: OpenRouter API (multi-model support)
  - GPT-4 Turbo (primary)
  - Claude 3.5 Sonnet (fallback)
  - Gemini Pro 1.5 (fallback)
- **Token Management**: tiktoken
- **Prompt Engineering**: Structured prompts with validation
- **Cost Optimization**: Model selection based on complexity

**Infrastructure:**
- **Server**: FirstVDS (Ubuntu 22.04 LTS)
- **Reverse Proxy**: Caddy 2.x (automatic HTTPS)
- **Database**: Supabase Cloud (PostgreSQL 15+)
- **Cache**: Redis 7+ (rate limiting, sessions)
- **Queue**: BullMQ (async processing, optional)
- **Storage**: Supabase Storage (images, cards)
- **Email**: SendGrid or Resend
- **CRM**: AmoCRM API v4

**Deployment:**
- **CI/CD**: GitHub Actions → webhook → auto-deploy
- **Version Control**: Git (semantic versioning)
- **Branching**: main (production), feature branches
- **Deployment**: Git pull → npm install → build → migrate → PM2 reload

### Telegram Bot Development Standards

**Bot Design Principles:**
- One question per screen (no overwhelming users)
- Progress indicators for multi-step flows
- Inline keyboards for quick responses
- State persistence (users can pause and resume)
- Error messages in Russian, user-friendly
- Emoji usage for visual appeal (Gen Z audience)

**Webhook vs Polling:**
- Production: Webhook (https://api.skilltree.app/webhook)
- Development: Polling (local development with ngrok)

**Message Formatting:**
- Use Telegram MarkdownV2 or HTML
- Max message length: 4096 characters (paginate if needed)
- Buttons: max 8 per row, max 100 buttons total

**State Management:**
- Store conversation state in Supabase
- Session timeout: 24 hours
- Allow resume from last question

### OpenRouter AI Integration Standards

**Model Selection Strategy:**
- Default: `openai/gpt-4-turbo` (best quality)
- Fallback 1: `anthropic/claude-3.5-sonnet` (if GPT-4 fails)
- Fallback 2: `google/gemini-pro-1.5` (cost optimization)
- Retry logic: 3 attempts with exponential backoff

**Prompt Engineering:**
- Structured prompts with clear instructions
- Include student answers with question references
- Request specific output format (JSON or structured text)
- Token budget: 700-1000 words output
- Temperature: 0.7 (balance creativity and consistency)

**Cost Management:**
- Track cost per generation
- Budget alerts at $50, $100, $150 monthly
- Log all API calls for audit
- Cache common responses (optional)

**Error Handling:**
- Fallback to simpler model on timeout
- Generic response if all models fail
- Log all API errors to monitoring

### File Organization

**Monorepo Structure (Turborepo or Nx):**
```
apps/
  ├── api/              # NestJS backend
  ├── bot/              # Telegram bot service
  ├── frontend/         # Next.js frontend (optional)
  └── admin/            # Admin dashboard
packages/
  ├── database/         # Prisma schema + migrations
  ├── shared/           # Shared TypeScript types
  └── config/           # Shared configuration
```

**Development Artifacts:**
- **Agents**: `.claude/agents/{domain}/{orchestrators|workers}/`
- **Commands**: `.claude/commands/`
- **Skills**: `.claude/skills/{skill-name}/SKILL.md`
- **Specifications**: `.specify/specs/{###-feature-name}/`
- **Templates**: `.specify/templates/`
- **Temporary Files**: `.tmp/current/` (git ignored)
- **Reports**: `docs/reports/{domain}/{YYYY-MM}/`

### Code Quality Standards

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` or proper typing)
- Explicit return types for functions
- JSDoc comments for public APIs

**Prisma:**
- Migrations for all schema changes
- Test migrations in development first
- Backup database before production migrations
- Use transactions for multi-table operations

**Error Handling:**
- Use custom error classes
- Log all errors with context
- User-friendly error messages (Russian)
- Never expose internal errors to users

**Logging:**
- Structured logging (JSON format)
- Log levels: error, warn, info, debug
- Include request IDs for tracing
- No sensitive data in logs (PII, tokens)

### Russian Market Compliance

**Language:**
- All user-facing text in Russian
- Error messages in Russian
- Admin panel can be English (developer audience)

**Regional Settings:**
- Timezone: Moscow Time (UTC+3)
- Currency: Russian Ruble (₽)
- Phone format: +7 (XXX) XXX-XX-XX
- Date format: DD.MM.YYYY

**Payment Integration (Future):**
- Russian payment systems: ЮKassa, Тинькофф
- Comply with 54-ФЗ (online cash registers)
- VAT calculation for Russian entities

## Governance

### Constitution Authority

This constitution supersedes all other development practices. When conflicts arise between this constitution and other guidance, the constitution takes precedence.

### Amendment Procedure

Constitution amendments require:
1. Documented rationale for change
2. Impact analysis on existing templates and workflows
3. Version bump according to semantic versioning:
   - **MAJOR**: Backward incompatible governance or principle removals/redefinitions, technology stack changes
   - **MINOR**: New principle or section added, or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. Sync Impact Report identifying affected templates
5. Update of all dependent templates and documentation

### Compliance Review

All feature specifications, plans, and implementations MUST verify compliance with this constitution. The "Constitution Check" section in plan-template.md enforces this requirement.

### Complexity Justification

Any violation of constitutional principles MUST be justified in the "Complexity Tracking" section of plan.md. Justifications must explain:
- Why the principle violation is necessary
- Why simpler alternatives were rejected
- Mitigation strategies for introduced complexity

### Runtime Guidance

Development runtime guidance is maintained in `CLAUDE.md` at repository root. This file provides operational procedures that implement constitutional principles but may be updated more frequently than the constitution itself.

### Version History

- **2.0.0** (2025-01-17): Major update for SkillTree project - complete technology stack rewrite, added Telegram Bot standards, OpenRouter integration, Russian market compliance
- **1.0.0** (2025-11-10): Initial constitution for Symancy project

---

**Version**: 2.0.0
**Ratified**: 2025-11-10
**Last Amended**: 2025-01-17
**Project**: SkillTree
**Maintainer**: Igor Maslennikov
