# Deep Research: Email Services & Data Visualization for SkillTree Bot

**Date**: 2025-12-28
**Context**: MVP Telegram bot for career guidance for Russian teenagers (14-17 years old)
**Expected Load**: 1,000-10,000 users/month in the first 6 months
**Target Market**: Russia (compliance with local data protection laws required)

---

## Research Topic 1: Russian Email Service Providers

### Background

We need a transactional email service for a Telegram bot that helps Russian teenagers with career assessment. The bot needs to send:
- **Verification codes**: 4-digit codes with 15-minute TTL for parent email verification
- **Parent reports**: HTML emails with embedded radar chart images (~5-10 KB), career recommendations, and salary data
- **Reminders**: Notifications about incomplete tests (after 12 hours of inactivity)

### Requirements

| Requirement | Priority | Details |
|-------------|----------|---------|
| **Russian data residency** | MUST | Compliance with Federal Law 152-FZ (personal data of Russian citizens must be stored in Russia) |
| **Free tier or low cost** | MUST | Up to 5,000 emails/month for MVP phase, budget max $20/month |
| **Programmatic API** | MUST | REST API or Node.js SDK for integration with NestJS backend |
| **HTML templates** | MUST | Support for rich HTML with inline images or hosted image URLs |
| **High deliverability** | SHOULD | >95% inbox placement rate (not spam folder) |
| **Transactional focus** | SHOULD | Optimized for triggered emails, not bulk marketing |
| **Russian documentation** | NICE | Documentation in Russian for faster onboarding |
| **SMTP fallback** | NICE | SMTP support as alternative to API |

### Candidates to Evaluate

Please research and compare these Russian/CIS email service providers:

1. **UniSender** (unisender.com) — Major Russian player, transactional + marketing
2. **SendPulse** (sendpulse.com) — International with Russian office, SMTP + API
3. **Sendsay** (sendsay.ru) — Russian enterprise-focused
4. **DashaMail** (dashamail.ru) — Russian, known for deliverability
5. **Mailganer** (mailganer.ru) — Russian transactional specialist
6. **eSputnik** (esputnik.com) — Ukrainian/CIS, multilingual
7. **Notisend** (notisend.ru) — Russian transactional-first
8. **RuSender** (rusender.ru) — If exists, Russian-only
9. **Mailhandler** — If available in Russia

Also briefly compare with international alternatives that MAY have Russian data centers:
- **SendGrid** (Twilio) — check Russia compliance
- **Mailgun** — check Russia compliance
- **Amazon SES** — check Russia compliance

### Evaluation Criteria

| Criterion | Weight | How to Measure |
|-----------|--------|----------------|
| **Free tier / pricing** | 25% | Free emails/month, cost per 1,000 emails after free tier |
| **API quality & Node.js SDK** | 20% | Official SDK availability, REST API documentation quality, code examples |
| **Deliverability reputation** | 20% | Industry reviews, case studies, inbox placement rates |
| **152-FZ compliance** | 15% | Explicit statement about Russian data storage, legal entity in Russia |
| **HTML + images support** | 10% | Template builder, inline image support, dynamic content |
| **Documentation quality** | 5% | Russian docs, tutorials, API reference completeness |
| **Reliability / uptime** | 5% | SLA, status page history, reviews |

### Expected Deliverables

1. **Comparison table** with all candidates scored on each criterion
2. **Top 2 recommendations** with detailed justification
3. **Sample integration code** (Node.js/TypeScript) for the recommended service
4. **Pricing calculator** for 1K, 5K, 10K, 50K emails/month scenarios
5. **Risk assessment** for each recommended option
6. **Migration path** if we need to switch providers later

---

## Research Topic 2: Radar Chart Visualization Libraries

### Background

We need to generate radar charts (spider/web diagrams) showing a user's RIASEC career profile. The chart has 6 axes:
- **R**ealistic (hands-on, technical)
- **I**nvestigative (research, analysis)
- **A**rtistic (creative expression)
- **S**ocial (helping, teaching)
- **E**nterprising (leadership, business)
- **C**onventional (organization, detail)

Each axis has a score from 0-100. The chart needs to be generated server-side as PNG and sent via Telegram Bot API.

### Requirements

| Requirement | Priority | Details |
|-------------|----------|---------|
| **Server-side PNG generation** | MUST | Node.js environment, output PNG buffer |
| **No usage limits** | MUST | Free and unlimited (not per-month quotas) |
| **6-axis radar chart** | MUST | Proper radar/spider chart with 6 labeled axes |
| **Customizable colors** | MUST | Different color schemes based on top RIASEC dimension |
| **Russian text labels** | MUST | UTF-8 support, Cyrillic characters with emoji |
| **Modern aesthetic** | SHOULD | Not "Excel-style", visually appealing for teenagers |
| **Fast generation** | SHOULD | <500ms per chart on 2GB RAM VDS |
| **Small bundle size** | NICE | Minimal dependencies, reasonable install size |
| **TypeScript support** | NICE | Type definitions available |

### Architecture Options to Evaluate

#### Option A: Native Node.js Libraries (Canvas-based)
Render charts using node-canvas or similar, no browser needed.

Candidates:
- **chart.js + chartjs-node-canvas** — Most popular, but canvas native deps
- **echarts + node-echarts-canvas** — Feature-rich, Chinese origin
- **vega + vega-lite + canvas** — Declarative grammar, academic quality
- **d3.js + d3-node** — Maximum flexibility, steeper learning curve
- **roughjs + rough-viz** — Hand-drawn aesthetic, unique style
- **ApexCharts** — Modern design, check server-side support

#### Option B: SVG-based Libraries
Generate SVG, then convert to PNG if needed.

Candidates:
- **d3.js** — SVG output, convert with sharp/librsvg
- **svg-radar-chart** — Specialized for radar charts
- **Charts.css** — CSS-only charts (needs browser)

#### Option C: External APIs (with good free tiers)
Use a chart-as-a-service API.

Candidates:
- **QuickChart.io** — 500 free/month, $40/month unlimited
- **Image-Charts.com** — 150,000 free/month but watermarked
- **ChartURL.com** — Check pricing and limits
- **Plotly Chart Studio** — Check API access

#### Option D: Headless Browser (Puppeteer/Playwright)
Render any JS chart library in headless Chrome.

Candidates:
- **Puppeteer + Chart.js** — Any chart lib works, but heavy
- **Playwright + ECharts** — Cross-browser, similar weight

### Visual Style Requirements

We want charts that look modern and appealing to teenagers, NOT corporate/Excel-style.

**Preferred aesthetic**:
```
Style A - Minimalist Modern:
- Thin grid lines (opacity 0.15-0.2)
- Gradient fill (e.g., blue to purple)
- Dots at data points with subtle glow
- Soft drop shadow for depth
- Clean sans-serif font (Inter, Roboto)
- Emoji in axis labels (🔧 Realistic, 🔬 Investigative, etc.)

Style B - Hand-drawn/Friendly:
- Slightly irregular lines (roughjs style)
- Pastel colors
- Handwritten-style font
- Playful, approachable feel
- Good for teenage audience
```

**Output sizes needed**:
- 600x600 px — For Telegram inline display
- 1080x1080 px — For shareable Instagram/Stories cards

### Evaluation Criteria

| Criterion | Weight | How to Measure |
|-----------|--------|----------------|
| **Visual quality / aesthetics** | 25% | Sample outputs, customization examples |
| **Ease of integration** | 20% | Lines of code needed, API simplicity |
| **Cost (free = best)** | 20% | No monthly limits, no watermarks |
| **Customization depth** | 15% | Colors, fonts, gradients, animations |
| **Performance** | 10% | Generation time, memory usage |
| **Bundle size / deps** | 10% | npm install size, native dependencies |

### Expected Deliverables

1. **Architecture recommendation** (A, B, C, or D) with justification
2. **Library recommendation** within chosen architecture
3. **Working code example** generating a sample RIASEC radar chart
4. **Visual samples** or links to example outputs
5. **Performance benchmarks** if available
6. **Fallback plan** if primary choice doesn't work out

---

## Research Topic 3: Shareable Image Card Generation

### Background

After completing the career test, users can share their results as an image card optimized for social media (Instagram Stories, Telegram, VK).

### Card Specifications

**Dimensions**: 1080x1080 px (square, Instagram-optimized)

**Elements**:
1. **Background**: Gradient based on top RIASEC dimension color
2. **Radar chart**: Embedded in center (600x600 area)
3. **Personality archetype**: Large text, e.g., "Strategic Innovator 🧠💡"
4. **Top career match**: "Data Scientist (92% match)"
5. **User name** (optional): First name only
6. **Branding**: SkillTree logo (120x120), bot link CTA
7. **Decorative elements**: Subtle patterns, icons

**Color schemes by dimension**:
| Dimension | Primary Color | Gradient |
|-----------|--------------|----------|
| Realistic | Amber #F59E0B | #FEF3C7 → #FFFFFF |
| Investigative | Blue #3B82F6 | #DBEAFE → #FFFFFF |
| Artistic | Pink #EC4899 | #FCE7F3 → #FFFFFF |
| Social | Green #10B981 | #D1FAE5 → #FFFFFF |
| Enterprising | Purple #8B5CF6 | #EDE9FE → #FFFFFF |
| Conventional | Gray #6B7280 | #F3F4F6 → #FFFFFF |

### Requirements

| Requirement | Priority | Details |
|-------------|----------|---------|
| **PNG output** | MUST | High-quality PNG buffer for Telegram |
| **Composite images** | MUST | Layer radar chart onto background |
| **Text rendering** | MUST | Russian text, emoji support, multiple fonts |
| **Gradient backgrounds** | MUST | Linear gradients with custom colors |
| **Logo overlay** | MUST | Place PNG logo at specified position |
| **Fast generation** | SHOULD | <1 second per card |
| **No native deps** | NICE | Pure JS preferred for easier deployment |

### Candidates to Evaluate

1. **node-canvas** (Automattic) — Full Canvas API, native deps (cairo)
2. **skia-canvas** — Modern, fast, Skia-based
3. **sharp** — Fast image processing, limited drawing
4. **jimp** — Pure JS, slower but no native deps
5. **Fabric.js** (server mode) — Rich API, designed for composition
6. **konva** + node-canvas — Layer-based, good for complex layouts
7. **Puppeteer + HTML/CSS** — Pixel-perfect but heavy
8. **satori** (Vercel) — HTML/CSS to SVG, then convert to PNG

### Evaluation Criteria

| Criterion | Weight | How to Measure |
|-----------|--------|----------------|
| **Composition capabilities** | 25% | Layering, positioning, blending |
| **Text rendering quality** | 20% | Font support, emoji, anti-aliasing |
| **Performance** | 20% | Generation speed, memory usage |
| **Ease of use** | 15% | API simplicity, documentation |
| **Dependencies** | 10% | Native deps, install complexity |
| **Bundle size** | 10% | npm package size |

### Expected Deliverables

1. **Library recommendation** with justification
2. **Working code example** generating a sample share card
3. **Performance comparison** of top 2-3 options
4. **Font handling guide** for Russian text + emoji
5. **Deployment notes** for VDS (native deps compilation if needed)

---

## Technical Context

### Current Stack
- **Runtime**: Node.js 18+ with TypeScript 5+
- **Framework**: NestJS (API), grammY (Telegram bot)
- **Database**: PostgreSQL on Supabase Cloud
- **Hosting**: VDS with 2GB RAM, PM2 process manager
- **No Docker**: Direct deployment on Ubuntu

### Constraints
- **Budget**: $0-20/month for external services (MVP phase)
- **Integration time**: 1-2 days per component
- **Performance**: Must handle 100 concurrent chart generations
- **Compliance**: Russian data protection law (152-FZ) for email

### Priority Order
1. **Legal compliance** (email must be 152-FZ compliant)
2. **Visual quality** (charts must look modern, not "Excel-style")
3. **Cost** (prefer free/unlimited solutions)
4. **Ease of integration** (simple API, good docs)

---

## Output Format

For each research topic, provide:

### 1. Executive Summary
- Recommended solution in one sentence
- Key trade-off accepted

### 2. Comparison Matrix
| Candidate | Criterion 1 | Criterion 2 | ... | Total Score |
|-----------|-------------|-------------|-----|-------------|
| Option A  | 8/10        | 7/10        | ... | 75/100      |

### 3. Detailed Analysis of Top 3
- Pros and cons
- Pricing breakdown
- Integration complexity

### 4. Implementation Guide
- Step-by-step setup
- Code examples (TypeScript)
- Configuration templates

### 5. Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Service downtime | Low | High | Fallback to SMTP |

### 6. Decision Record
- Chosen solution
- Alternatives considered
- Reasons for rejection

---

## Questions to Answer

### Email Services
1. Which Russian email providers offer the best free tier for transactional emails?
2. Do any international providers (SendGrid, Mailgun) have Russian data centers?
3. What is the typical deliverability rate for Russian email services?
4. How do Russian providers handle HTML emails with embedded images?
5. What are the SPF/DKIM/DMARC requirements for each provider?

### Visualization
1. Which chart library produces the most visually appealing radar charts?
2. Can chart.js/echarts run server-side without Puppeteer?
3. What are the memory/CPU requirements for generating 100 charts/minute?
4. How to handle Cyrillic text and emoji in chart labels?
5. Are there any open-source radar chart designs we can use as inspiration?

### Image Generation
1. Which library has the best text rendering for Russian + emoji?
2. How to achieve gradient backgrounds with transparency?
3. What's the performance difference between canvas-based and Puppeteer approaches?
4. How to handle custom font loading on Linux servers?
5. Are there any pre-built templates for social media cards we can adapt?
