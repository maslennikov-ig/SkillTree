# Results & Visualization Strategy: SkillTree Career Guidance Platform

**Feature**: 001-project-setup (documentation for future phases)
**Date**: 2025-01-18
**Status**: Design Complete
**Source**: Research report "EdTech Career Guidance App: Strategic Research Report"

## Executive Summary

This document defines the complete results visualization and parent engagement strategy for SkillTree, based on research showing that **radar charts achieve 9/10 wow-effect score** and **parental education expectations predict child outcomes 40 years later**. The strategy covers:

1. **Radar Chart Visualization** (personality dimensions)
2. **Parent Email Reports** (engagement & lead generation)
3. **Dual-Persona Messaging** (teens vs parents)
4. **Shareable Results Cards** (viral growth)
5. **Progressive Disclosure** (curiosity gap mechanics)

**Goal**: Maximize results sharing (target 30%+) and parent engagement (target 50%+ email opt-in).

---

## 1. Radar Chart Visualization

### Why Radar Charts?

**Research Findings**:
- **16Personalities**: Uses pentagon radar chart for Big Five personality traits
- **YouScience**: Uses circular radar for aptitude scores
- **User Feedback**: 9/10 wow-effect score vs 6/10 for bar charts
- **Psychological Impact**: Radar charts create "complete picture" feeling vs fragmented bars
- **Social Proof**: Industry standard in personality assessments worldwide

### Dimensions to Visualize

**6 Career Aptitude Dimensions** (RIASEC + Big Five hybrid):

| Dimension | Description | Example Careers (High Score) |
|-----------|-------------|------------------------------|
| **Realistic** 🔧 | Hands-on, technical, mechanical work | Engineer, Mechanic, Pilot |
| **Investigative** 🔬 | Research, analysis, problem-solving | Scientist, Data Analyst, Doctor |
| **Artistic** 🎨 | Creative expression, design, innovation | Designer, Artist, Architect |
| **Social** 🤝 | Helping, teaching, communicating | Teacher, Psychologist, HR Manager |
| **Enterprising** 💼 | Leadership, persuasion, business | Entrepreneur, Manager, Lawyer |
| **Conventional** 📊 | Organization, detail, procedures | Accountant, Administrator, Analyst |

**Score Range**: 1-100 (normalized from question responses)

### Visual Design Specifications

**Chart Configuration**:
```json
{
  "type": "radar",
  "data": {
    "labels": ["Realistic 🔧", "Investigative 🔬", "Artistic 🎨", "Social 🤝", "Enterprising 💼", "Conventional 📊"],
    "datasets": [{
      "label": "Your Career Profile",
      "data": [65, 88, 72, 45, 58, 80],
      "backgroundColor": "rgba(54, 162, 235, 0.2)",
      "borderColor": "rgba(54, 162, 235, 1)",
      "borderWidth": 2,
      "pointBackgroundColor": "rgba(54, 162, 235, 1)",
      "pointRadius": 5
    }]
  },
  "options": {
    "scale": {
      "ticks": {
        "beginAtZero": true,
        "max": 100,
        "stepSize": 20
      }
    }
  }
}
```

**Implementation**:
- **Library**: Chart.js (free, 60KB gzipped)
- **Alternative**: QuickChart API (https://quickchart.io/chart?c={config}) for server-side rendering
- **Telegram Bot**: Send as photo (PNG 1080x1080px)
- **Web Dashboard**: Interactive HTML5 canvas

**Color Palette** (based on 16Personalities):
- **High score** (80-100): Bright blue `#36A2EB`
- **Medium score** (50-79): Moderate blue `#4BC0C0`
- **Low score** (0-49): Light gray `#9CA3AF`

### Interpretation Guidelines

**Score Ranges**:
- **80-100**: "Strong alignment! This is your superpower 💪"
- **60-79**: "Good fit! You have solid potential here ⭐"
- **40-59**: "Moderate interest. Could be developed 📈"
- **20-39**: "Lower priority. Other areas may suit you better"
- **0-19**: "Minimal alignment. Focus on your strengths instead"

**Example Result Message** (Telegram):
```
🎯 Your Career Profile

Your strongest dimension:
🔬 Investigative: 88/100
"You excel at research, analysis, and solving complex problems!"

Top career matches:
1. Data Scientist 🎓
2. Medical Researcher 🔬
3. Financial Analyst 💰

[View Full Report] [Share Results]
```

---

## 2. Parent Email Reports

### Why Parent Engagement Matters

**Research Findings**:
- **40-Year Prediction**: Parental education expectations predict child outcomes 4 decades later
- **EdTech Reality**: Parents make 80% of purchase decisions for teen education
- **Lead Generation**: Parent email = CRM gold (lifetime value 10x vs student contact)
- **Conversion Rate**: Free reports convert 4-6x better than paid-upfront models

### Email Capture Strategy

**Timing** (when to ask for parent email):

1. **After Section 3** (55% complete):
   - Teen has invested 8-10 minutes
   - Insight teaser shown ("You might excel in fields like...")
   - Curiosity gap created → motivation to get full results
   - Message: "Want your detailed report sent to your parents? They'll get personalized career guidance for you 📧"

2. **After Test Completion** (alternative):
   - Full results shown to teen first
   - Then offer: "Share this with your parents via email? They'll get insights + next steps 👨‍👩‍👧"

**Opt-In Form** (Telegram inline keyboard):
```
━━━━━━━━━━━━━━━━━━
Share Results with Parents?

📧 Yes, send to parent email
⏭️ Skip (view results now)
━━━━━━━━━━━━━━━━━━
```

**Email Validation**:
- Validate format: `^\S+@\S+\.\S+$`
- Send confirmation code (4-digit)
- Parent must verify before receiving report
- Privacy note: "We only use this for your career report. No spam, promise! 🔒"

### Email Template Structure

**Subject Line Options** (A/B test):
- "Ваш ребенок прошел тест карьерного потенциала — результаты внутри" (formal)
- "[Имя]: Мы нашли 5 идеальных профессий для твоего ребенка 🎯" (casual, higher open rate)

**Email Content** (HTML + Plain Text):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Responsive email design */
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .header { background: #36A2EB; color: white; padding: 20px; text-align: center; }
    .radar-chart { max-width: 600px; margin: 20px auto; }
    .career-match { background: #f0f9ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .cta-button { background: #36A2EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Результаты теста карьерного потенциала</h1>
    <p>Для: [Имя студента]</p>
  </div>

  <div style="padding: 20px;">
    <h2>Профиль карьерного потенциала</h2>
    <img src="[RADAR_CHART_URL]" alt="Career Profile" class="radar-chart">

    <h3>Топ-5 профессий для вашего ребенка:</h3>

    <div class="career-match">
      <h4>1. Data Scientist 🎓</h4>
      <p><strong>Соответствие:</strong> 92% | <strong>Зарплата:</strong> 150,000-300,000₽/мес</p>
      <p>Ваш ребенок показал выдающиеся результаты в аналитическом мышлении и решении сложных задач.</p>
      <p><strong>Следующие шаги:</strong> Курсы Python, математика, участие в олимпиадах</p>
    </div>

    <div class="career-match">
      <h4>2. UX Designer 🎨</h4>
      <p><strong>Соответствие:</strong> 85% | <strong>Зарплата:</strong> 120,000-250,000₽/мес</p>
      <p>Сильные стороны: креативность, эмпатия, визуальное мышление</p>
    </div>

    <!-- 3 more career matches -->

    <h3>Что дальше?</h3>
    <p>Запишитесь на бесплатную 15-минутную консультацию с карьерным экспертом, чтобы обсудить:</p>
    <ul>
      <li>Подробный анализ сильных сторон</li>
      <li>Персональный план развития</li>
      <li>Рекомендации по курсам и олимпиадам</li>
      <li>Ответы на вопросы о будущей карьере</li>
    </ul>

    <center>
      <a href="[BOOKING_LINK]" class="cta-button">Записаться на консультацию</a>
    </center>

    <hr>

    <p style="color: #666; font-size: 12px;">
      Этот отчет создан на основе ответов вашего ребенка на 55 вопросов карьерного теста.
      Методология: RIASEC (Holland Code) + Big Five personality framework.
    </p>
  </div>
</body>
</html>
```

**Plain Text Version** (for email clients without HTML):
```
РЕЗУЛЬТАТЫ ТЕСТА КАРЬЕРНОГО ПОТЕНЦИАЛА
Для: [Имя студента]

ТОП-5 ПРОФЕССИЙ:

1. Data Scientist 🎓
   Соответствие: 92% | Зарплата: 150,000-300,000₽/мес
   Сильные стороны: аналитическое мышление, решение задач

[Full text version...]

Записаться на консультацию: [LINK]
```

### Email Service Integration

**Service Options**:
| Service | Free Tier | Cost (1,000 emails/mo) | Features |
|---------|-----------|------------------------|----------|
| **SendGrid** | 100/day | Free | Templates, analytics, API |
| **Mailgun** | 5,000/mo | Free (first 3 months) | Logs, webhooks, validation |
| **Resend** | 100/day | $0 | Modern API, React Email support |

**Recommendation**: Start with **SendGrid** (100 emails/day = 3,000/month free).

**Implementation**:
```typescript
// apps/api/src/services/email.service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendParentReport(params: {
  parentEmail: string;
  studentName: string;
  radarChartUrl: string;
  topCareers: Career[];
}) {
  const msg = {
    to: params.parentEmail,
    from: 'reports@skilltree.app',
    subject: `${params.studentName}: Результаты теста карьерного потенциала`,
    templateId: 'd-xxxxxxxxxxxxx', // SendGrid dynamic template
    dynamicTemplateData: {
      studentName: params.studentName,
      radarChartUrl: params.radarChartUrl,
      career1: params.topCareers[0],
      career2: params.topCareers[1],
      // ... more fields
    }
  };

  await sgMail.send(msg);
}
```

---

## 3. Dual-Persona Messaging

### Teen Messaging (Gamified, Aspirational)

**Tone**: Energetic, emoji-heavy, social proof, FOMO, aspirational

**Example CTAs**:
- "Узнай, в чем ты крут! 🚀" (Find out what you're great at!)
- "Открой свои суперсилы 💪" (Unlock your superpowers)
- "2,341 студентов уже нашли свой путь. Ты следующий? 🎯" (Social proof)
- "Поделись результатами — покажи, кто ты есть! 📤" (Share your results)

**Language**:
- Use "ты" (informal)
- Short sentences
- Lots of emojis (but not overdoing it)
- Gamification language: "level up", "unlock", "achievement"

**Example Message** (after completing test):
```
🎉 ТЕСТ ЗАВЕРШЕН!

Твой профиль готов! 🎯

Топ-3 профессии:
1. Data Scientist 🎓 (92% match)
2. UX Designer 🎨 (85% match)
3. Game Developer 🎮 (78% match)

Поделись результатами с друзьями:
📤 Отправить в чат
📷 Скачать картинку для Stories

Кстати, у тебя +500 баллов! 🔥
```

### Parent Messaging (Data-Driven, Professional)

**Tone**: Professional, evidence-based, ROI-focused, authority, reassuring

**Example CTAs**:
- "Получите персональный план развития для вашего ребенка" (data-driven)
- "Основано на 70+ летних исследованиях личности" (authority)
- "150,000₽ средняя зарплата рекомендованных профессий" (ROI)
- "Запишитесь на бесплатную консультацию" (low-friction offer)

**Language**:
- Use "Вы" (formal)
- Longer sentences, more context
- Fewer emojis, more statistics
- Professional terminology: "career guidance", "aptitude assessment", "development plan"

**Example Email Snippet**:
```
Уважаемые родители!

Ваш ребенок [Имя] прошел комплексный тест карьерного потенциала,
основанный на методологии RIASEC (Holland Code) и модели Big Five.

Анализ показал выдающиеся способности в области аналитического мышления
(88-й процентиль) и творческого решения задач (92-й процентиль).

Рекомендуемые направления:
• Data Science (прогнозируемый доход: 150,000-300,000₽/мес)
• UX Design (прогнозируемый доход: 120,000-250,000₽/мес)

Следующий шаг: Персональная консультация с карьерным экспертом для
разработки индивидуального плана развития.

[Записаться на консультацию]
```

### Messaging Triggers by User Type

| User Type | Detection Method | Primary Message Style | CTA Focus |
|-----------|------------------|----------------------|-----------|
| **Teen (13-17)** | Age field in registration | Gamified, social | Share results, unlock badges |
| **Parent** | Receives email report | Professional, ROI | Book consultation, get plan |
| **Young Adult (18-22)** | Age field | Hybrid (aspirational + data) | Career roadmap, university choices |

---

## 4. Shareable Results Cards

### Why Shareable Cards?

**Research Findings**:
- **Viral Growth**: Each share = potential new user (viral coefficient >1.0 target)
- **Social Proof**: Instagram/Stories format = authenticity + aspirational
- **Low Friction**: One-tap share vs "tell your friends" (15x higher conversion)
- **Format**: 1080x1080px (Instagram/Telegram Stories optimized)

### Card Design Specifications

**Visual Layout**:
```
┌─────────────────────────────────────┐
│  SkillTree Logo (top-left)          │
│                                     │
│  [RADAR CHART - 600x600px]         │
│                                     │
│  Твой Профиль:                     │
│  🔬 Investigative Genius             │
│                                     │
│  Топ профессия:                    │
│  Data Scientist 🎓                  │
│  Соответствие: 92%                 │
│                                     │
│  t.me/skilltreebot — Пройди тест!  │
└─────────────────────────────────────┘
```

**Design Elements**:
- **Background**: Gradient (light blue to white) or solid color based on top dimension
- **Typography**:
  - Title: Montserrat Bold, 48px
  - Body: Inter Regular, 32px
  - Footer: Inter Regular, 24px
- **Logo**: Top-left corner, 120x120px
- **Radar Chart**: Centered, 600x600px
- **CTA**: Bottom, "t.me/skilltreebot — Пройди тест!" with QR code (optional)

**Color Schemes by Top Dimension**:
| Dimension | Primary Color | Gradient |
|-----------|---------------|----------|
| Realistic | `#F59E0B` (Orange) | `#FEF3C7` to `#FFFFFF` |
| Investigative | `#3B82F6` (Blue) | `#DBEAFE` to `#FFFFFF` |
| Artistic | `#EC4899` (Pink) | `#FCE7F3` to `#FFFFFF` |
| Social | `#10B981` (Green) | `#D1FAE5` to `#FFFFFF` |
| Enterprising | `#8B5CF6` (Purple) | `#EDE9FE` to `#FFFFFF` |
| Conventional | `#6B7280` (Gray) | `#F3F4F6` to `#FFFFFF` |

### Implementation

**Server-Side Generation** (Node.js + Canvas API):
```typescript
// apps/api/src/services/results-card.service.ts
import { createCanvas, loadImage } from 'canvas';
import Chart from 'chart.js/auto';

export async function generateResultsCard(params: {
  studentName: string;
  radarData: number[];
  topCareer: string;
  matchPercentage: number;
  topDimension: string;
}) {
  const canvas = createCanvas(1080, 1080);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, getColorForDimension(params.topDimension).light);
  gradient.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  // Draw radar chart (using Chart.js)
  const radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
      datasets: [{
        data: params.radarData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)'
      }]
    }
  });

  // Add text overlays
  ctx.font = 'bold 48px Montserrat';
  ctx.fillStyle = '#1F2937';
  ctx.fillText(`Твой Профиль: ${params.topDimension}`, 540, 800);

  ctx.font = '32px Inter';
  ctx.fillText(`Топ профессия: ${params.topCareer}`, 540, 860);
  ctx.fillText(`Соответствие: ${params.matchPercentage}%`, 540, 920);

  // Footer CTA
  ctx.font = '24px Inter';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('t.me/skilltreebot — Пройди тест!', 540, 1020);

  // Return as buffer
  return canvas.toBuffer('image/png');
}
```

**Telegram Bot Integration**:
```typescript
// apps/bot/src/handlers/results.handler.ts
import { Bot } from 'grammy';
import { generateResultsCard } from '@skilltree/api/services/results-card.service';

bot.command('share', async (ctx) => {
  const userId = ctx.from?.id;
  const results = await getTestResults(userId);

  const cardBuffer = await generateResultsCard({
    studentName: results.studentName,
    radarData: results.radarData,
    topCareer: results.topCareer,
    matchPercentage: results.matchPercentage,
    topDimension: results.topDimension
  });

  await ctx.replyWithPhoto(new InputFile(cardBuffer), {
    caption: '📤 Поделись результатами в Stories или с друзьями!',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Отправить в чат', switch_inline_query: 'Я нашел свою профессию!' }],
        [{ text: '🔗 Скопировать ссылку', callback_data: 'copy_share_link' }]
      ]
    }
  });
});
```

---

## 5. Progressive Disclosure (Curiosity Gap)

### Strategy

**Goal**: Keep users engaged through partial reveals, creating desire for full results.

**Disclosure Timeline**:

| Stage | Progress | Teaser Content | Psychology |
|-------|----------|---------------|------------|
| **After Section 1** (20%) | "Interesting... you show strong analytical thinking 🤔" | Spark curiosity |
| **After Section 2** (40%) | "Your profile suggests careers in: [preview 1-2 fields]" | Anticipation building |
| **After Section 3** (60%) | "You scored above average in [dimension]! Full breakdown coming..." | Investment reinforcement |
| **After Section 4** (80%) | "Almost there! Your top career match is... 🎯 (Complete to reveal)" | FOMO trigger |
| **Completion** (100%) | **FULL RESULTS**: Radar chart + Top 5 careers + Detailed breakdown | Payoff |

**Example Messages**:

**After Section 2** (40% complete):
```
🔍 Интересно...

Твои ответы указывают на:
• Сильное аналитическое мышление
• Интерес к технологиям

Возможные направления:
💻 Data Science
🎨 UX Design

Продолжай тест, чтобы увидеть полный профиль! (23 вопроса осталось)
```

**After Section 3** (60% complete):
```
⭐ Ты на правильном пути!

Твой показатель Investigative:
88/100 — это выше среднего! 📊

Что это значит для твоей карьеры?
Узнаешь через 22 вопроса 😉

[Продолжить тест]
```

### Why Progressive Disclosure Works

**Psychological Principles**:
1. **Zeigarnik Effect**: Uncompleted tasks create mental tension → motivation to finish
2. **Curiosity Gap**: "You scored high in X" → "What does this mean?" → complete test
3. **Investment Bias**: "I've come this far, I want my full results"
4. **Anticipation > Reality**: Waiting for results makes them feel more valuable

**Research Backing**:
- CareerExplorer uses live career match updates during test (Spotify-like shuffling)
- 16Personalities shows partial type indicators mid-test
- YouScience reveals aptitude categories progressively

---

## 6. Implementation Checklist

### Phase 1: Radar Charts (Week 3)

- [ ] Choose chart library (Chart.js vs QuickChart API)
- [ ] Design radar chart template (6 dimensions, color scheme)
- [ ] Implement score calculation algorithm (normalize to 0-100)
- [ ] Generate radar chart image server-side (Canvas API)
- [ ] Send radar chart in Telegram bot (after test completion)
- [ ] Store radar chart URL in database (for email reports)

### Phase 2: Parent Email Reports (Week 3)

- [ ] Set up SendGrid account and API key
- [ ] Create HTML email template with radar chart embed
- [ ] Implement email capture flow (after Section 3 or completion)
- [ ] Add email validation (format + confirmation code)
- [ ] Store parent email in Parent table (encrypted)
- [ ] Send automated report email with top 5 careers
- [ ] Track email open rate and click-through rate (SendGrid analytics)

### Phase 3: Shareable Results Cards (Week 4)

- [ ] Design 1080x1080px card template (Figma/Canva)
- [ ] Implement server-side image generation (Canvas API)
- [ ] Generate unique card per user with radar chart + top career
- [ ] Add share buttons in Telegram (Stories, chat, copy link)
- [ ] Track share rate (% users who share results)

### Phase 4: Progressive Disclosure (Week 4)

- [ ] Define insight teasers for Sections 1-4
- [ ] Implement teaser message triggers (after section completion)
- [ ] A/B test teaser content (curiosity vs specific details)
- [ ] Measure impact on completion rate (target: +10%)

---

## 7. Success Metrics

### Visualization Metrics

- **Radar Chart Wow Factor**: User survey after seeing chart (target: 8+/10)
- **Results View Rate**: % users who view full results (target: 95%+)
- **Results Re-View Rate**: % users who return to view results again (target: 30%+)

### Parent Engagement Metrics

- **Email Opt-In Rate**: % users who provide parent email (target: 50%+)
- **Email Delivery Rate**: % emails successfully delivered (target: 95%+)
- **Email Open Rate**: % parents who open report (target: 40%+)
- **Email Click-Through Rate**: % who click consultation CTA (target: 15%+)
- **Consultation Booking Rate**: % who book after email (target: 5%+)

### Viral Growth Metrics

- **Share Rate**: % users who share results (target: 30%+)
- **Click-Through from Share**: % who click shared link (target: 20%+)
- **Conversion from Share**: % who complete test after clicking (target: 50%+)
- **Viral Coefficient**: New users per existing user (target: >1.0 by Month 3)

---

## 8. Budget & Tools

### Required Tools

| Tool | Purpose | Free Tier | Paid Plan |
|------|---------|-----------|-----------|
| **Chart.js** | Radar chart generation | ✅ Free (MIT) | N/A |
| **QuickChart** | Alternative chart API | 500/mo free | $0.001/chart |
| **SendGrid** | Email delivery | 100/day free | $15/mo (40k emails) |
| **Canvas (Node.js)** | Image generation | ✅ Free | N/A |
| **Canva/Figma** | Card design templates | ✅ Free tier | $0 (one-time design) |

**Total Monthly Cost**: **0₽** (free tiers sufficient for MVP, <3,000 users/month)

---

## 9. Conclusion

This results strategy ensures SkillTree delivers **high wow-factor visualizations** (radar charts), **strong parent engagement** (email reports), and **viral growth** (shareable cards). Key differentiators:

1. **Radar Charts**: Industry-standard visualization with 9/10 wow-effect
2. **Dual-Persona**: Different messaging for teens (gamified) vs parents (data-driven)
3. **Progressive Disclosure**: Curiosity gap mechanics keep users engaged
4. **Shareable Cards**: 1080x1080px Instagram-optimized format for viral growth

**Implementation Priority**:
- **Week 3**: Radar charts + parent email reports (MUST-HAVE)
- **Week 4**: Shareable cards + progressive disclosure (NICE-TO-HAVE)

**Success Definition**:
- Month 1: 50% parent email opt-in, 30% share rate
- Month 3: 40% email open rate, 15% consultation booking rate
- Month 6: 1.0+ viral coefficient from shared results

Focus on visual impact, parent trust, and frictionless sharing. Ship MVP, measure conversion, iterate based on parent feedback. Good luck! 🚀
