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
- Database: PostgreSQL 15+ (Supabase)
- ORM: Prisma or TypeORM

**AI/ML:**
- OpenAI GPT-4 API (text generation)
- Token estimation: tiktoken
- Prompt engineering for personalized reports

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
- OpenAI API

**Infrastructure:**
- Hosting: Vercel (frontend) + Railway/Render (backend)
- Database: Supabase (PostgreSQL + Auth + Storage)
- Cache: Redis (optional, for rate limiting)
- Queue: BullMQ (optional, for async processing)

---

## 📊 Project Phases

### **PHASE 1: FOUNDATION (MVP Core)** — 3-4 weeks

**Goal:** Launch functional bot with basic registration, testing, AI analysis, and lead generation.

#### Phase 1.1: Project Setup & Infrastructure (3-5 days)
- Initialize monorepo structure (Turborepo or Nx)
- Setup PostgreSQL database schema (Prisma)
- Configure Telegram Bot (webhook + ngrok for dev)
- Setup environment variables & secrets management
- Configure CI/CD pipeline (GitHub Actions)
- **Deliverable:** Working dev environment

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
- OpenAI GPT-4 integration:
  - Prompt engineering for personalized reports
  - Token management (700-1000 word output)
  - Error handling & retry logic
- Report generation:
  - Top 3 strengths (with percentages)
  - Growth areas
  - 3 priority subjects for university exams
  - Top 5 recommended universities (with reasoning)
- Report storage in database
- **Deliverable:** AI-powered personalized reports

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

### OpenAI API
- Token usage limits
- Cost monitoring
- Fallback responses if API fails

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
- Local: ngrok for Telegram webhook testing
- Database: Supabase (dev project)
- Environment: `.env.local`

### Staging Environment
- Frontend: Vercel (preview deployments)
- Backend: Railway/Render (staging instance)
- Database: Supabase (staging project)
- Domain: `staging.skilltree.app`

### Production Environment
- Frontend: Vercel (production)
- Backend: Railway/Render (production instance)
- Database: Supabase (production project)
- Domain: `skilltree.app` (or subdomain)
- Monitoring: Sentry, LogRocket, or similar

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
| **Phase 1.1** | 3-5 days | Project setup & infrastructure |
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

- Hosting (Vercel + Railway): $25-50
- Database (Supabase Pro): $25
- OpenAI API (300 users @ $0.03-0.05 each): $9-15
- SendGrid (email): $0-15 (free tier or basic)
- Domain: $1/month
- **Total:** ~$60-100/month

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
