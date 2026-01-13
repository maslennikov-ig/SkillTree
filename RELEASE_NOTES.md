# Release Notes

User-facing release notes for all versions.

## v0.2.5

_Released on 2026-01-13_

### 🐛 Bug Fixes

- **pdf**: Resolve text overlap issues in cover page and badges

---

_This release was automatically generated from 1 commits._

## v0.2.4

_Released on 2026-01-13_

### 🐛 Bug Fixes

- **pdf**: Resolve achievement grid overflow and improve stability

---

_This release was automatically generated from 1 commits._

## v0.2.3

_Released on 2026-01-13_

### 🐛 Bug Fixes

- **Database**: Update BINARY question options with meaningful text

---

_This release was automatically generated from 1 commits._

## v0.2.2

_Released on 2026-01-13_

### ✨ New Features

- **Database**: Add 1 source file(s), update 7 source file(s), +1 more

### 🐛 Bug Fixes

- **API**: Remove footer text to prevent page 4 creation
- **API**: Reduce next steps to fit on page 3
- **API**: Prevent footer from creating new page in PDF
- **API**: Fix page 4 empty footer issue in PDF
- **API**: Improve PDF generation quality
- **shared**: Add reverse RIASEC archetype pairs (AR, IR, AI, etc.)
- **API**: Replace corrupted Inter font files with valid TTF
- **bot**: Show actual option texts for BINARY questions, remove rainbow emoji from Q44

---

_This release was automatically generated from 9 commits._

## v0.2.1

_Released on 2026-01-09_

### ✨ New Features

- **bot**: Add inline query handler for sharing results

### 🐛 Bug Fixes

- **apps/bot/src/services/results.service.ts**: Update 4 source file(s)
- **CI/CD**: Add TypeScript cache cleanup to deploy-staging
- **CI/CD**: Update workflows for SkillTree project structure
- **CI/CD**: Add Prisma generate step before build/type-check

---

_This release was automatically generated from 6 commits._

## v0.2.0

_Released on 2026-01-08_

### ✨ New Features

- **API**: Add public share endpoints for results
- **bot**: Add shareable results with tg://msg_url and forward
- **bot**: Implement tester feedback improvements

### 🔧 Improvements

- **bot**: Code review improvements

### 🐛 Bug Fixes

- **bot**: Add ratingRange field for rating scale labels
- **CI/CD**: Simplify workflow - build only on VDS
- **CI/CD**: Add Prisma generate step before build
- **CI/CD**: Build all packages before type-check
- **CI/CD**: Let pnpm auto-detect version from packageManager
- **CI/CD**: Correct pnpm version and app directory path

---

_This release was automatically generated from 11 commits._

## v0.1.12

_Released on 2026-01-06_

### ✨ New Features

- **bot**: Show 'Продолжить тест' keyboard during quiz
- **002**: Phases 3-14 telegram bot MVP implementation
- **002**: Phase 2.5 environment configuration
- **002**: Phase 2 foundational infrastructure for telegram bot mvp
- **002**: Phase 0-1 setup for telegram bot mvp

### 🐛 Bug Fixes

- **bot**: Handle OPEN_TEXT questions and improve quiz UX
- **bot**: Add .hears() handlers for reply keyboard buttons
- **bot**: Add dotenv for .env file loading
- **bot**: Add cwd to PM2 ecosystem config for .env loading
- **bot**: Fix TypeScript Record lookup type errors in results.service.ts
- **Database**: Fix TypeScript errors in seed.ts

---

_This release was automatically generated from 15 commits._

## v0.1.11

_Released on 2025-12-27_

### 🐛 Bug Fixes

- **API**: Lazy-load TelegramNotifier after dotenv init

---

_This release was automatically generated from 2 commits._
