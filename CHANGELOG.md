# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-01-08

### Added
- **api**: add public share endpoints for results (98d2506)
- **bot**: add shareable results with tg://msg_url and forward (6186554)
- **bot**: implement tester feedback improvements (565a7fe)

### Changed
- **bot**: code review improvements (c9e6d4a)

### Fixed
- **bot**: add ratingRange field for rating scale labels (aa226df)
- **ci**: simplify workflow - build only on VDS (924d8b4)
- **ci**: add Prisma generate step before build (f4f58ff)
- **ci**: build all packages before type-check (b6d0b51)
- **ci**: let pnpm auto-detect version from packageManager (98beb63)
- **ci**: correct pnpm version and app directory path (8891966)

### Other
- add GitHub Actions auto-deploy for bot to VDS (f6ac78f)

## [0.1.12] - 2026-01-06

### Added
- **bot**: show 'Продолжить тест' keyboard during quiz (81b9cd0)
- **002**: phases 3-14 telegram bot MVP implementation (a97dc6d)
- **002**: phase 2.5 environment configuration (a9f6adb)
- **002**: phase 2 foundational infrastructure for telegram bot mvp (453d98e)
- **002**: phase 0-1 setup for telegram bot mvp (0aab0a1)

### Fixed
- **bot**: handle OPEN_TEXT questions and improve quiz UX (b3140cf)
- **bot**: add .hears() handlers for reply keyboard buttons (29c8258)
- **bot**: add dotenv for .env file loading (c3a6a4b)
- **bot**: add cwd to PM2 ecosystem config for .env loading (2bee7c5)
- **bot**: fix TypeScript Record lookup type errors in results.service.ts (6d1962f)
- **database**: fix TypeScript errors in seed.ts (8c94f79)

### Other
- add testing guide for QA (e86829d)
- **tasks**: mark T119 as complete - bot deployed to VDS (dff2c69)
- **tasks**: mark T017, T021 as complete after VDS deployment (4e386ac)
- move deep-research-prompt to Research folder (6b38be2)

## [0.1.11] - 2025-12-27

### Fixed
- **api**: lazy-load TelegramNotifier after dotenv init (3282885)

### Other
- update release script with dual changelog support (4df3420)

## [0.1.10] - 2025-12-18

### Added
- **api**: complete Phase 7 & 8 - Deployment pipeline & Monitoring (3c7759a)

### Fixed
- **database**: add build output for production deployment (74721f7)

## [0.1.9] - 2025-12-10

### Added
- **api**: complete Phase 6 & 6.5 - Health API & Telegram notifications (80633e6)

## [0.1.8] - 2025-12-10

### Added
- **infra**: complete Phase 5 - VDS server provisioning (58e421d)

## [0.1.7] - 2025-12-10

## [0.1.6] - 2025-11-30

### Added
- **agents**: add nextjs-ui-designer agent (9ef70ca)

## [0.1.5] - 2025-11-18

### Fixed
- sync Prisma schema with data model and add gamification tables (dd686ad)

## [0.1.4] - 2025-11-18

### Fixed
- **api**: correct middleware configuration and update tasks progress (e72d2da)

## [0.1.3] - 2025-11-17

### Added
- **setup**: complete Phase 1 - monorepo setup (T008-T010) (9267632)
- **setup**: complete T003-T007 core configuration (8833f07)
- **setup**: complete T001-T002 monorepo initialization (1be653f)

## [0.1.2] - 2025-11-17

### Added
- **planning**: complete P001-P003 executor assignment and agent creation (d3d2379)
- complete Phases 7-9 - deployment, logging, documentation (1aeaf11)
- implement structured logging with Pino (Phase 8, T117-T134) (e122303)
- **api**: implement Health Check API and Telegram notifier (f94e949)
- **infra**: create VDS server provisioning scripts (9662ed1)
- **database**: implement complete Prisma schema (0240f51)
- **setup**: complete Phase 3 - developer environment (2a82a68)
- **setup**: complete Phase 2 - foundational packages (af90070)

## [0.1.1] - 2025-11-17

## [1.1.2] - 2025-11-14

## [1.1.1] - 2025-11-11
