# SkillTree - Technical Specification
## AI-Powered Career Guidance Telegram Bot for Students

---

## 🎯 Project Overview

**Project Name:** SkillTree  
**Version:** 1.0  
**Target Audience:** Russian students aged 14-18 (grades 9-11) + their parents  
**Platform:** Telegram Bot (Web App)  
**Primary Goal:** Convert students into qualified leads through AI-powered career assessment with gamification and viral growth mechanics

---

## 📋 Executive Summary

SkillTree is a Telegram-based career guidance platform that:
1. Assesses student skills through a 55-question psychological test
2. Generates personalized AI reports with university recommendations
3. Automatically converts parents into leads via email + AmoCRM integration
4. Drives viral growth through gamification (badges) and referral system
5. Creates shareable content (visual cards) for social media distribution

**Key Differentiator:** Combines professional career assessment with gaming mechanics (skill trees, badges, progress bars) familiar to Gen Z.

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- Node.js 18+ / TypeScript
- Framework: NestJS or Express
- Telegram Bot API (grammY or node-telegram-bot-api)
- Database: PostgreSQL 15+ (Supabase Cloud)
- ORM: Prisma or TypeORM
- Auth: Supabase Auth (optional for admin panel)

**AI/ML:**
- OpenRouter API (multi-model support: GPT-4, Claude, Gemini)
- Token estimation: tiktoken
- Prompt engineering for personalized reports
- Cost optimization via model selection

**Frontend (Telegram Web App):**
- React 18+ / Next.js 14+
- Telegram WebApp SDK
- State management: Zustand or Redux Toolkit
- UI: Tailwind CSS + shadcn/ui

**Image Generation:**
- Canvas API (Node.js: node-canvas) or Puppeteer
- Alternative: Cloudinary for image processing

**Email Service:**
- SendGrid or Resend
- Templating: Handlebars or React Email

**Integrations:**
- AmoCRM API v4
- Telegram Bot API
- OpenRouter API

**Infrastructure (Hybrid: FirstVDS + Supabase Cloud):**
- VDS Server: FirstVDS (Ubuntu 22.04 LTS)
- Reverse Proxy: Caddy 2.x (automatic HTTPS)
- Database: Supabase Cloud (PostgreSQL 15+ managed)
- Storage: Supabase Storage (for images, optional)
- Cache: Redis 7+ on VDS (for rate limiting & sessions)
- Queue: BullMQ on VDS (for async processing)
- Process Manager: PM2 or systemd
- Deployment: Git pull + auto-deploy hooks
- Monitoring: Optional (Prometheus + Grafana or similar)

---

## 📊 Project Phases

### **PHASE 1: FOUNDATION (MVP Core)** — 3-4 weeks

**Goal:** Launch functional bot with basic registration, testing, AI analysis, and lead generation.

#### Phase 1.1: Project Setup & Infrastructure (5-7 days)
**Server Setup (FirstVDS):**
- Provision FirstVDS server (Ubuntu 22.04 LTS)
- Install Caddy 2.x with automatic HTTPS
- Install Redis 7+ (persistence enabled)
- Configure firewall (UFW: ports 80, 443, 22 only)
- Setup SSH key authentication (disable password auth)

**Supabase Cloud Setup:**
- Create Supabase project (MegaCampusAI or new project)
- Configure database connection settings
- Setup RLS policies (if needed)
- Optional: Configure Supabase Storage for image uploads
- Get connection strings and API keys

**Application Setup:**
- Initialize monorepo structure (Turborepo or Nx)
- Setup Prisma ORM with Supabase PostgreSQL connection
- Configure Telegram Bot (webhook for production, polling for dev)
- Setup environment variables & secrets management (.env + vault)
- Configure PM2 for process management
- Setup Git deployment hooks (GitHub webhook → auto-deploy)

**Environment Variables:**
```bash
# Supabase
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_WEBHOOK_URL=https://api.skilltree.app/webhook

# Other services
AMOCRM_API_KEY=...
SENDGRID_API_KEY=...
```

**Caddy Configuration:**
```caddy
skilltree.app {
    reverse_proxy localhost:3000
    encode gzip
    log {
        output file /var/log/caddy/access.log
    }
}

api.skilltree.app {
    reverse_proxy localhost:4000
    encode gzip
}

admin.skilltree.app {
    reverse_proxy localhost:5000
    encode gzip
}
```

**Deployment Flow:**
1. Push to GitHub main branch
2. GitHub webhook triggers deployment script on VDS
3. Script pulls latest code, installs deps, runs migrations
4. PM2 restarts services with zero-downtime

- **Deliverable:** Fully configured VDS with CI/CD pipeline

#### Phase 1.2: User Registration System (4-6 days)
**Features:**
- Student registration flow:
  - Name (text input)
  - Age (number picker)
  - Grade (9/10/11 selector)
  - City (autocomplete or manual)
- Parent contact collection:
  - Parent name
  - Email (with validation)
  - Phone (with format validation)
- Phone number deduplication check (anti-fraud)
- Data validation & error handling
- Progress state management
- **Deliverable:** Complete registration flow with database persistence

**Database Schema:**
```sql
TABLE users (
  id UUID PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  age INTEGER,
  grade INTEGER,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

TABLE parents (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Phase 1.3: Assessment System (55 Questions) (7-10 days)
**Features:**
- Question database design (5 sections × 11 questions)
- Question types:
  - Multiple choice (3-5 options)
  - Likert scale (1-5)
  - Optional: Ranking (drag-drop)
- One question per screen (Telegram inline keyboard)
- Progress bar: "Question 12/55 | ████░░░░░ 22%"
- Progress persistence (resume from last question)
- Navigation: Next, Previous, Pause buttons
- Answer validation
- Section transitions with visual feedback
- **Deliverable:** Complete testing engine

**Database Schema:**
```sql
TABLE question_sections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  order INTEGER NOT NULL,
  description TEXT
)

TABLE questions (
  id UUID PRIMARY KEY,
  section_id UUID REFERENCES question_sections(id),
  text TEXT NOT NULL,
  type ENUM('multiple_choice', 'likert', 'ranking'),
  order INTEGER NOT NULL,
  metadata JSONB -- {options: [], min: 1, max: 5}
)

TABLE test_sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  current_question_id UUID,
  progress INTEGER DEFAULT 0
)

TABLE answers (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES test_sessions(id),
  question_id UUID REFERENCES questions(id),
  value JSONB NOT NULL, -- {answer: "A", score: 4}
  answered_at TIMESTAMP DEFAULT NOW()
)
```

#### Phase 1.4: AI Analysis Engine (5-7 days)
**Features:**
- Answer aggregation & scoring algorithm
- OpenRouter API integration:
  - Multi-model support (GPT-4, Claude 3.5 Sonnet, Gemini Pro)
  - Prompt engineering for personalized reports
  - Token management (700-1000 word output)
  - Cost optimization: model selection based on complexity
  - Error handling & retry logic with fallback models
- Report generation:
  - Top 3 strengths (with percentages)
  - Growth areas
  - 3 priority subjects for university exams
  - Top 5 recommended universities (with reasoning)
- Report storage in database
- **Deliverable:** AI-powered personalized reports

**OpenRouter Configuration:**
- Primary model: `openai/gpt-4-turbo` or `anthropic/claude-3.5-sonnet`
- Fallback model: `google/gemini-pro-1.5`
- Cost tracking per generation
- Rate limiting protection

**Report Structure (JSON):**
```json
{
  "personality_type": "Innovator",
  "strengths": [
    {"name": "Analytical Thinking", "score": 87, "description": "..."},
    {"name": "Creativity", "score": 82, "description": "..."},
    {"name": "Leadership", "score": 78, "description": "..."}
  ],
  "growth_areas": [
    {"name": "Time Management", "description": "..."}
  ],
  "recommended_subjects": [
    "Mathematics", "Computer Science", "Physics"
  ],
  "recommended_universities": [
    {"name": "MSU", "reason": "...", "programs": ["CS", "Engineering"]},
    ...
  ],
  "ai_narrative": "Based on your answers (questions 12, 23, 31)..."
}
```

#### Phase 1.5: Result Visualization in Bot (3-4 days)
**Features:**
- Formatted text output with emoji
- Progress bars: `Logic ████████░░ 85%`
- Structured message layout:
  - Personality type header
  - Strengths section (top 3)
  - Growth areas
  - Recommended subjects
  - Universities list
  - AI narrative (expandable if long)
- Message pagination (if exceeds Telegram limits)
- **Deliverable:** Beautiful in-bot result display

#### Phase 1.6: Shareable Result Card Generator (4-5 days)
**Features:**
- PNG image generation (1080×1920 - Instagram Story format)
- Visual design:
  - Gradient background (customizable)
  - Personality type title
  - Top 3 strengths with progress bars
  - Motivational quote
  - Bot link with referral code
- Alternative formats:
  - Square (1080×1080)
  - Telegram-native (no external sharing needed)
- Image upload to Telegram
- **Deliverable:** Visual shareable cards

**Tech Implementation:**
- Use `node-canvas` or Puppeteer (headless browser)
- SVG → PNG conversion
- Store generated images in Supabase Storage (optional caching)

#### Phase 1.7: Automated Parent Email (3-4 days)
**Features:**
- Email template design (HTML + plain text fallback)
- Personalization:
  - Parent name
  - Student name
  - Top 3 strengths
  - Recommended subjects
  - Top 5 universities
- CTA button: "BOOK 2 FREE LESSONS"
- Urgency element: "Offer valid for 7 days"
- Tracking: open rate, click rate
- SendGrid integration
- **Deliverable:** Automated email system

**Email Template Structure:**
```html
Subject: [Student Name] completed career assessment! 📊

Hi [Parent Name],

Great news! [Student Name] just completed our AI-powered career assessment.

Top Strengths:
1. Analytical Thinking (87%)
2. Creativity (82%)
3. Leadership (78%)

Recommended Focus:
- Mathematics, Computer Science, Physics

Best University Matches:
1. MSU - Computer Science
2. MIPT - Engineering
...

[LARGE CTA BUTTON: BOOK 2 FREE LESSONS]

Offer expires: [Date + 7 days]
```

#### Phase 1.8: AmoCRM Integration (3-4 days)
**Features:**
- Lead creation via AmoCRM API v4
- Data mapping:
  - Contact: parent name, email, phone
  - Lead: "Career Assessment: [Student Name] ([Age] years, Grade [X])"
  - Custom fields:
    - City
    - Student age/grade
    - Top strengths
    - Recommended subjects
    - Status: "Clicked email CTA — HOT" (if tracked)
- Webhook for email click tracking
- Error handling & retry logic
- **Deliverable:** Automatic lead creation

#### Phase 1.9: Admin Dashboard (5-7 days)
**Features:**
- Web interface (Next.js)
- Authentication (username/password)
- Student list:
  - Table with filters (city, grade, date)
  - Search (by name, email, phone)
  - Sorting
- Detail view:
  - Student info
  - Parent contacts
  - Test results
  - AI report
  - Generated cards
- Export:
  - CSV/Excel export
  - Filter before export
- **Deliverable:** Admin panel for monitoring

#### Phase 1.10: Fraud Prevention (2-3 days)
**Features:**
- Phone number duplicate detection
- Anti-abuse logic:
  - First use: bonus granted
  - Duplicate: allow test, but no bonus
  - Message: "This phone number already received a bonus"
- Admin override capability
- **Deliverable:** Fraud protection

**PHASE 1 TOTAL:** 39-55 days (156-196 hours estimated)

---

### **PHASE 2: GAMIFICATION & VIRAL GROWTH** — 2-3 weeks

**Goal:** Increase completion rate (45% → 60%+) and enable viral organic growth.

#### Phase 2.1: Badge System (5-7 days)
**Features:**
- Badge database (10-15 badges)
- Badge categories:
  - **Progress Badges:**
    - "Starter" — 10 questions
    - "Explorer" — 25 questions
    - "Determined" — 55 questions completed
  - **Performance Badges:**
    - "Perfect Section" — 100% focus in one section
    - "Speed Demon" — completed in <15 minutes
    - "Thoughtful" — completed in >30 minutes
  - **Discovery Badges:**
    - "Treasure Hunter" — found easter egg
    - "Influencer" — referred 5 friends
- Badge unlock notifications
- Badge showcase page in bot
- Visual badge icons (emoji or images)
- **Deliverable:** Badge system with 10+ badges

**Database Schema:**
```sql
TABLE badges (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'progress', 'performance', 'discovery'
  icon TEXT, -- emoji or image URL
  rarity TEXT, -- 'common', 'rare', 'legendary'
  unlock_criteria JSONB -- {type: 'questions_answered', count: 25}
)

TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  unlocked_at TIMESTAMP DEFAULT NOW()
)
```

#### Phase 2.2: Referral System (6-8 days)
**Features:**
- Personal referral links:
  - Format: `t.me/skilltreebot?start=ref_[user_id]`
- Referral tracking:
  - Who referred whom
  - Referral status (registered, completed test)
- Rewards system:
  | Referrals | Reward |
  |-----------|--------|
  | 1 friend  | Bonus AI insight (extra paragraph) |
  | 3 friends | "Communicator" badge + extended university list |
  | 5 friends | "Influencer" badge + extended report (2000 words) |
  | 10 friends | Free 30-min career consultation |
- Referral dashboard in bot:
  - Referral count
  - Friend status (completed/in-progress)
  - Next reward milestone
- **Deliverable:** Referral system with rewards

**Database Schema:**
```sql
TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'registered', -- 'registered', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Phase 2.3: Viral Sharing Loop (5-6 days)
**Features:**
- Enhanced shareable cards:
  - Include referral link in image
  - Multiple formats (Story, Square, Telegram-native)
- Social proof counter:
  - "Already 3,847 students discovered their path"
  - "Currently taking test: 124 people"
- "Challenge Your Friends" feature:
  - Pre-written share text
  - "I'm an INNOVATOR 🚀 What's your type? Test yourself: [link]"
  - Copy button + direct Telegram share
- Friend activity feed (optional):
  - "Your friends completed the test: Maria K. — Innovator, Alex T. — Leader"
- **Deliverable:** Viral sharing mechanics

**PHASE 2 TOTAL:** 16-21 days (60-80 hours estimated)

---

## 🔐 Security & Compliance

### Data Protection
- GDPR-compliant data storage (if targeting EU users)
- Personal data encryption at rest
- Secure API key management (environment variables)
- Phone number hashing for deduplication

### Telegram Security
- Webhook validation (secret token)
- Rate limiting (prevent spam)
- Input sanitization (SQL injection prevention)

### OpenRouter API
- Token usage limits per user
- Cost monitoring and budget alerts
- Fallback responses if API fails
- Model selection based on load and cost

---

## 📊 Success Metrics (KPIs)

### Phase 1 (MVP)
- Registration completion rate: >80%
- Test completion rate: >45%
- Email open rate: >25%
- Email click-through rate: >5%
- Leads created in AmoCRM: 100% (all completions)

### Phase 2 (Gamification)
- Test completion rate: >60%
- Badge unlocks per user: avg 3+
- Referral coefficient: 0.5+ (50% of users refer ≥1 friend)
- Viral traffic share: 20-30%

---

## 🚀 Deployment Strategy

### Development Environment
- Local development: `localhost:3000` (frontend), `localhost:4000` (backend)
- Telegram webhook: ngrok tunnel for local testing
- Database: Supabase Cloud (dev project or local Supabase)
- Redis: Docker container or local install
- Environment: `.env.local`

### Production Environment (FirstVDS Server)
**Server Specifications:**
- Provider: FirstVDS
- OS: Ubuntu 22.04 LTS
- RAM: 4GB minimum (8GB recommended)
- Storage: 50GB SSD minimum
- CPU: 2 cores minimum

**Architecture:**
```
Internet
    ↓
Caddy (ports 80/443) ← FirstVDS
    ↓
    ├─→ Frontend (Next.js) :3000 → skilltree.app
    ├─→ Backend API (NestJS) :4000 → api.skilltree.app
    └─→ Admin Panel (Next.js) :5000 → admin.skilltree.app
    ↓
    ├─→ Redis :6379 (localhost only, on VDS)
    └─→ Supabase Cloud ← PostgreSQL (managed, external)
```

**Deployment Process:**
1. **Initial Setup:**
   - SSH into FirstVDS server
   - Install dependencies: Node.js 18+, Redis 7+, Caddy 2.x, PM2
   - Clone repository from GitHub
   - Configure environment variables (including Supabase connection)
   - Run database migrations
   - Start services with PM2

2. **Continuous Deployment (GitHub Webhook):**
   ```bash
   # /var/www/skilltree/deploy.sh
   #!/bin/bash
   cd /var/www/skilltree
   git pull origin main
   npm install
   npm run build
   npx prisma migrate deploy
   pm2 reload ecosystem.config.js --update-env
   ```

3. **PM2 Process Manager:**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'skilltree-api',
         script: 'dist/apps/api/main.js',
         instances: 2,
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 4000
         }
       },
       {
         name: 'skilltree-frontend',
         script: 'node_modules/.bin/next',
         args: 'start -p 3000',
         env: {
           NODE_ENV: 'production'
         }
       },
       {
         name: 'skilltree-admin',
         script: 'node_modules/.bin/next',
         args: 'start -p 5000',
         cwd: './apps/admin',
         env: {
           NODE_ENV: 'production'
         }
       }
     ]
   }
   ```

4. **Caddy Configuration:**
   ```caddy
   # /etc/caddy/Caddyfile

   skilltree.app {
       reverse_proxy localhost:3000
       encode gzip
       log {
           output file /var/log/caddy/skilltree-frontend.log
       }
   }

   api.skilltree.app {
       reverse_proxy localhost:4000
       encode gzip
       header {
           Access-Control-Allow-Origin https://skilltree.app
           Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
       }
       log {
           output file /var/log/caddy/skilltree-api.log
       }
   }

   admin.skilltree.app {
       reverse_proxy localhost:5000
       encode gzip
       basicauth {
           admin $2a$14$hashed_password_here
       }
       log {
           output file /var/log/caddy/skilltree-admin.log
       }
   }
   ```

5. **GitHub Webhook Setup:**
   - Create deployment endpoint: `POST /api/deploy` (authenticated)
   - GitHub webhook triggers on push to `main`
   - Deployment script executes automatically

6. **Backup Strategy:**
   - Daily PostgreSQL dumps (automated cron job)
   - Store backups in `/var/backups/skilltree/`
   - Optional: sync to cloud storage (AWS S3, Backblaze B2)

7. **Monitoring:**
   - PM2 monitoring: `pm2 monit`
   - Logs: Caddy access logs + PM2 logs
   - Optional: Setup Grafana + Prometheus for advanced metrics

**Security Hardening:**
- UFW firewall: allow only 22 (SSH), 80 (HTTP), 443 (HTTPS)
- SSH: key-only authentication, disable root login
- Supabase: Row Level Security (RLS) policies enabled
- Redis: localhost-only, requirepass enabled
- Environment variables: stored in `.env` (not in repo)
- Regular security updates: `apt update && apt upgrade`
- Supabase connection: use service key only in backend, never expose to frontend

---

## 📝 Documentation Requirements

### Code Documentation
- Inline comments for complex logic
- JSDoc/TSDoc for functions
- README per package (monorepo)

### API Documentation
- OpenAPI/Swagger for REST endpoints
- Webhook documentation

### User Documentation
- Bot commands list (`/help`)
- FAQ section in bot
- Admin dashboard user guide

---

## 🧪 Testing Strategy

### Unit Tests
- Business logic (scoring algorithm)
- Utility functions
- 80%+ coverage goal

### Integration Tests
- API endpoints
- Database operations
- External service integrations (OpenAI, AmoCRM)

### E2E Tests
- Registration flow
- Test-taking flow
- Result generation
- Playwright or Cypress

### Manual Testing
- Beta testing with 20-30 real users
- UX feedback collection
- Bug reporting

---

## 📅 Timeline Summary

| Phase | Duration | Features |
|-------|----------|----------|
| **Phase 1.1** | 5-7 days | VDS setup + project infrastructure |
| **Phase 1.2** | 4-6 days | User registration |
| **Phase 1.3** | 7-10 days | Assessment system (55 questions) |
| **Phase 1.4** | 5-7 days | AI analysis engine |
| **Phase 1.5** | 3-4 days | Result visualization |
| **Phase 1.6** | 4-5 days | Shareable cards |
| **Phase 1.7** | 3-4 days | Email automation |
| **Phase 1.8** | 3-4 days | AmoCRM integration |
| **Phase 1.9** | 5-7 days | Admin dashboard |
| **Phase 1.10** | 2-3 days | Fraud prevention |
| **Phase 2.1** | 5-7 days | Badge system |
| **Phase 2.2** | 6-8 days | Referral system |
| **Phase 2.3** | 5-6 days | Viral sharing |
| **TOTAL** | **5-7 weeks** | Full system |

---

## 💰 Operational Costs (Monthly Estimates)

**Infrastructure:**
- **FirstVDS Server:** ₽1,500-3,000/month (~$15-30)
  - 4GB RAM, 2 CPU cores, 50GB SSD
- **Supabase Cloud:**
  - Free tier: $0 (500MB database, 50,000 monthly active users)
  - Pro tier: $25/month (8GB database, 100,000 monthly active users)
  - Start with free tier, upgrade when needed
- **Domain (.app or .ru):** ₽100-500/month (~$1-5)

**API Services:**
- **OpenRouter API** (300 users @ 1 report each):
  - GPT-4 Turbo: $0.01-0.03/report = $3-9/month
  - Claude 3.5 Sonnet: $0.015-0.024/report = $4.5-7.2/month
  - Mix strategy: ~$5-10/month
- **SendGrid (email):** $0-15/month (free tier for <100 emails/day, or Essentials plan)

**Optional:**
- **Backups (cloud storage):** ₽300-500/month (~$3-5)

**Total (Starting):** ~₽1,600-3,500/month (~$16-38/month) with Supabase free tier
**Total (Scaled):** ~₽4,100-6,000/month (~$41-63/month) with Supabase Pro

**Cost Benefits of Hybrid Approach:**
- Managed database (Supabase) = no maintenance overhead
- Self-hosted application = full control + cost savings vs Vercel/Railway
- Supabase free tier = great for MVP/testing phase
- Predictable scaling costs

---

## 🎯 Next Steps

1. Review and approve this specification
2. Setup development environment
3. Create detailed task breakdown (spec-kit)
4. Begin Phase 1.1 (Project Setup)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-17  
**Status:** Draft for Review
