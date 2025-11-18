# Gamification Strategy: SkillTree Career Guidance Platform

**Feature**: 001-project-setup
**Date**: 2025-01-17
**Status**: Design Complete
**Source**: Research report "EdTech Career Guidance App: Strategic Research Report"

## Executive Summary

This document defines the complete gamification strategy for SkillTree, based on research showing that **challenge-based gamification improves student performance by 89%** and proper progress indicators make users **willing to wait 3x longer**. The strategy combines:

1. **Progressive Weekly Streak Bonus** (unique mechanic)
2. **Points & Badges System** (industry standard)
3. **Referral Mechanics** (viral growth)
4. **Achievement Easter Eggs** (delight factor)

**Goal**: Maximize test completion rate (target 70%+) and create viral growth (coefficient >1.0).

---

## 1. Points System

### Point Economy

**Core Earning Mechanics**:
| Action | Points | Rationale |
|--------|--------|-----------|
| Answer 1 question | +10 | Steady progress reward |
| Complete section (11 questions) | +100 | Milestone celebration |
| Complete full test (55 questions) | +500 | Major achievement |
| Daily check-in (progressive) | +1 to +7 | Weekly streak bonus |
| Successful referral | +50 | Viral growth incentive |
| Share results | +25 | Social sharing reward |
| Find easter egg | +30 | Delight factor |

**Maximum Points Per Test Session**:
- Questions: 55 × 10 = 550
- Sections: 5 × 100 = 500
- Completion bonus: 500
- **Total**: 1,550 points per completed test

**Weekly Streak Bonus** (see Section 2):
- Perfect week (7 days): +28 points (1+2+3+4+5+6+7)

**Point Display**:
```
Your Score: 450 points 🎯
Week Streak: +15 points 🔥
Referrals: +100 points 📤
Total: 565 points
```

### Point Utility

**What Points Unlock**:
- **500 pts**: Career Comparison feature
- **1,000 pts**: Detailed career roadmap PDF
- **2,000 pts**: Free 15-minute consultation
- **5,000 pts**: Premium insights lifetime access
- **10,000 pts**: Personal career mentor session (1 hour)

**Leaderboard** (optional, privacy-protected):
- Weekly top 10 users
- Class/school leaderboards (opt-in)
- "You're in top 15% this week" percentile display

---

## 2. Progressive Weekly Streak System

### Core Mechanic (UNIQUE INNOVATION)

**Standard streak tracking** (Duolingo-style): Visual display of consecutive days
**Progressive bonus** (SkillTree innovation): Increasing rewards each day

**How It Works**:

**Monday** (Day 1):
- User performs qualifying activity
- Reward: +1 point
- Display: "🔥 Day 1 streak! +1 point. Tomorrow: +2!"

**Tuesday** (Day 2):
- User performs qualifying activity
- Reward: +2 points
- Display: "🔥 Day 2 streak! +2 points. Tomorrow: +3!"

**Wednesday** (Day 3):
- Reward: +3 points
- Display: "🔥 Day 3 streak! +3 points. Halfway to perfect week!"

**Thursday** (Day 4):
- Reward: +4 points

**Friday** (Day 5):
- Reward: +5 points

**Saturday** (Day 6):
- Reward: +6 points

**Sunday** (Day 7):
- Reward: +7 points
- Display: "🎉 PERFECT WEEK! +7 points. Total weekly bonus: 28 points!"
- **Bonus Achievement**: `STREAK_7_DAYS` badge unlocked

**Monday (new week)**:
- Reset: currentDay = 0, weeklyPoints = 0
- Display: "New week starting! Build your streak again 💪"

### Qualifying Activities

To earn daily streak, user must perform **ONE** of these activities:
- ✅ Answer at least 1 question in active test session
- ✅ View career recommendations (after completing test)
- ✅ Share results with friend
- ✅ Use referral link to invite someone
- ✅ Complete any meaningful interaction (NOT just /start command)

**Not Qualifying**:
- ❌ Just opening bot (/start)
- ❌ Viewing help (/help)
- ❌ Passive actions

### Streak Break Handling

**If user misses a day**:
- Streak counter shows "Streak broken 💔"
- Weekly cycle continues (can still earn remaining days' points)
- Longest streak record preserved
- Motivational message: "Don't worry! Start fresh tomorrow. Your best streak: 5 days 🔥"

**Example**:
- Monday: +1 point ✅
- Tuesday: Missed ❌
- Wednesday: +1 point (restarted, not +3)
- Thursday: +2 points
- Friday: +3 points
- Saturday: +4 points
- Sunday: +5 points
- Total week: 1+0+1+2+3+4+5 = 16 points (vs perfect 28)

### Visual Representation

**In Telegram Bot**:
```
🔥 Your Streak
━━━━━━━━━━━━━━━━━━
Monday:    ✅ +1 pt
Tuesday:   ✅ +2 pts
Wednesday: ✅ +3 pts
Thursday:  ✅ +4 pts
Friday:    ⏳ Check in today! +5 pts
Saturday:  ⬜
Sunday:    ⬜
━━━━━━━━━━━━━━━━━━
This week: 10 points
Best streak: 12 days 🏆
```

---

## 3. Badges & Achievement System

### Core Badges (Progress-Based)

**Test Completion Milestones**:
| Badge | Criteria | Visual | Send As |
|-------|----------|--------|---------|
| Bronze Explorer 🥉 | 25% complete (14 questions) | Bronze medal icon | Sticker |
| Silver Seeker 🥈 | 50% complete (28 questions) | Silver medal icon | Sticker |
| Gold Achiever 🥇 | 75% complete (42 questions) | Gold medal icon | Sticker |
| Platinum Master 💎 | 100% complete (55 questions) | Diamond icon | Animated sticker |

**Timing & Behavior Badges**:
| Badge | Criteria | Wow-Effect |
|-------|----------|-----------|
| Speed Demon ⚡ | Finished test <10 min | High (skill validation) |
| Thoughtful Analyst 🧠 | Spent time on open-ended questions | Medium (thoughtfulness) |
| Perfect Pace ⏳ | Average 12-15 sec/question | Medium (neither rushed nor slow) |

**Streak Badges**:
| Badge | Criteria | Visual |
|-------|----------|--------|
| 3-Day Streak 🔥 | 3 consecutive days | Flame icon (small) |
| Perfect Week ⭐ | 7-day perfect week | Star crown |
| Month Warrior 👑 | 30-day streak | Gold crown |

**Referral Badges**:
| Badge | Criteria | Reward Unlock |
|-------|----------|---------------|
| Referral Bronze 🎖️ | 3 completed referrals | Career Comparison feature |
| Referral Silver 🎖️ | 5 completed referrals | Free consultation |
| Referral Gold 🎖️ | 10 completed referrals | Premium lifetime access |

### Easter Egg Badges (Hidden Achievements)

**Time-Based Secrets**:
- **Night Owl 🦉**: Took test between 11pm-2am
- **Early Bird 🐦**: Took test between 5am-7am
- **Weekend Warrior 💪**: Completed test on Saturday or Sunday

**Discovery Badges**:
- **Detective 🔍**: Found hidden career hint in question 33
- **Explorer 🗺️**: Viewed all career categories
- **Completionist 📊**: Downloaded full PDF report

**Special Events**:
- **Birthday Bonus 🎂**: Took test on their birthday (if provided in profile)
- **Lucky Number 🍀**: Answered exactly 33 questions in one session (not full 55)

**How Hidden Badges Work**:
- Not shown in badge list until earned
- Discovery creates surprise and delight
- Users share discoveries ("Did you find the Night Owl badge?")
- Creates replayability and word-of-mouth marketing

**Display After Earning**:
```
🎉 SURPRISE!
You unlocked a hidden badge!

🦉 Night Owl
"Most people sleep at this hour.
You're building your future!"

+30 bonus points
```

---

## 4. Referral System

### Referral Mechanics

**Referral Link Format**:
```
t.me/skilltreebot?start=ref_abc123xyz
```
- `abc123xyz` = unique code for each user
- Stored in `ReferralTracking` table with `referrerId`

**How It Works**:

**Step 1: User Shares**
- After completing test, show "Share Your Results 📤" button
- Generate unique referral link
- Inline keyboard options:
  - Share to Telegram contact
  - Share to group
  - Copy link
  - Share to Telegram Stories

**Step 2: Friend Clicks Link**
- Bot detects `start` parameter: `ref_abc123xyz`
- Creates `ReferralTracking` record with status=PENDING
- Welcome message: "👋 Welcome! [Friend's name] invited you. Complete the test and you'll both earn bonus points!"

**Step 3: Friend Completes Test**
- Status changes: PENDING → COMPLETED
- Both users receive rewards:
  - **Referrer**: +50 points + "🎉 [Friend] completed the test! +50 points"
  - **Referee**: +25 welcome bonus + "Thanks for joining! +25 bonus points"

**Step 4: Milestone Rewards**
- Track total completed referrals
- 3 referrals → Unlock Career Comparison feature + Bronze badge
- 5 referrals → Free 15-min consultation + Silver badge
- 10 referrals → Premium insights lifetime + Gold badge

### Viral Coefficient Optimization

**Target**: Viral coefficient >1.0 (each user brings >1 new user)

**Tactics**:
1. **Double-Sided Incentive**: Both parties benefit (not just referrer)
2. **Progress Visibility**: "2/3 referrals to unlock Career Comparison!"
3. **Social Proof**: "Invite 3 friends like 2,341 students already did"
4. **Shareable Results Card**: Instagram-worthy 1080×1080px graphic with personality type
5. **Low Friction**: One-tap sharing, no complex forms

**Measurement**:
```
Viral Coefficient = (Total Referrals Completed / Total Active Users)

Month 1 target: 0.5 (500 users → 250 referrals)
Month 3 target: 1.0 (2000 users → 2000 referrals)
Month 6 target: 1.5 (10000 users → 15000 referrals = organic growth)
```

---

## 5. Progress Indicators & Retention Mechanics

### Segmented Progress Bar

**Visual Format** (in Telegram message):
```
Question 12/55 | Section 2/5 | 35% Complete
⬛⬛⬛⬜⬜
```

**Section Breakdown** (5 sections, 11 questions each):
- **Section 1**: "Getting Started" (Q1-11)
- **Section 2**: "Learning About You" (Q12-22)
- **Section 3**: "Going Deeper" (Q23-33)
- **Section 4**: "Almost There" (Q34-44)
- **Section 5**: "Final Sprint" (Q45-55)

**Section Completion Messages**:
```
Section 1 Complete! 🎯
Bronze Level Achieved! +100 points
Progress: 20% done
```

### Motivational Messages

**Triggered Every 10-15 Questions**:

| Progress | Message | Purpose |
|----------|---------|---------|
| Q10 | "Checkpoint reached! 💪 Keep going!" | Early encouragement |
| Q15 | "Halfway through Section 2! You're doing great! ⭐" | Momentum |
| Q28 | "Over halfway! Just 27 more questions! 🚀" | Halfway milestone |
| Q40 | "Almost there! Only 15 left! You've got this! 🎉" | Push to finish |
| Q50 | "Final 5 questions! Amazing work! 🏁" | Finish line visible |

### Real-Time Insight Teasers

**Curiosity Gap Strategy** (partial reveals create desire for full results):

| Trigger Point | Teaser Message | Effect |
|---------------|----------------|--------|
| After Section 2 | "Interesting... your answers suggest strong creative thinking 🎨" | Curiosity |
| After Section 3 | "You might excel in fields like [preview career 1 or 2]" | Anticipation |
| After Section 4 | "Your analytical score is above average! Full breakdown coming..." | Engagement |

**Research Backing**: CareerExplorer uses live career match updates during test (Spotify-like shuffling) to maintain engagement.

---

## 6. Strategic Question Pacing (Anti-Drop-Off)

### Question Difficulty Distribution

**Research Finding**: Questions 1-15 have sharpest drop-off; Questions 15-35 show commitment; Questions 35+ users become indifferent to length.

**Strategic Design**:

| Questions | Difficulty | Type | Gamification |
|-----------|-----------|------|--------------|
| **Q1-5** | Easy | Multiple choice with emoji | 10 pts each, build momentum |
| **Q6-15** | Easy-Medium | Varied formats, rhythm | +100 bonus at Q10 "Checkpoint!" |
| **Q16-25** | Medium | Core assessment | Insight teaser at Q20, +50 bonus |
| **Q26-40** | Medium-Hard | Deep assessment | +200 bonus at Q30 "Halfway Champion!" |
| **Q41-50** | Easy-Medium | Return to easier formats | Countdown: "Only 10 left!" |
| **Q51-55** | Easy | Quick, satisfying closure | +500 completion bonus, confetti 🎉 |

### Question Type Mix

**Optimal Balance** (from research):
- **70%**: Multiple choice (highest user preference)
- **20%**: Rating scales (1-5 stars)
- **10%**: Other (visual, open-ended, binary)
- **Max 2-3**: Open-ended questions (high cognitive load, placed at Q25, Q40, Q52)

**Example Q1** (Easy, engaging):
```
Which excites you more?
💻 Technology | 🎨 Arts | 🔬 Science | 🤝 People
```

**Example Q30** (Moderate, core assessment):
```
Rate your interest in problem-solving: (1-5 ⭐)
⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐ ⭐⭐⭐⭐⭐
```

---

## 7. Implementation Checklist

### Phase 1: Core Points & Badges (Week 2)

- [ ] Implement point calculation logic in TestSession
- [ ] Create badge images (4 progress badges: Bronze, Silver, Gold, Platinum)
- [ ] Send badges as Telegram stickers/images after milestones
- [ ] Display running point total after each question
- [ ] Store points in TestSession.points field
- [ ] Store badges in TestSession.badges JSON array

### Phase 2: Weekly Streak System (Week 2)

- [ ] Create DailyStreak table (Prisma migration)
- [ ] Implement check-in detection logic (qualifying activities)
- [ ] Calculate progressive bonus (currentDay → points)
- [ ] Display streak status in bot (/streak command)
- [ ] Weekly reset cron job (runs every Monday 00:00)
- [ ] Track longestStreak for all-time records
- [ ] Award STREAK_7_DAYS badge for perfect week

### Phase 3: Referral System (Week 2)

- [ ] Create ReferralTracking table (Prisma migration)
- [ ] Generate unique referral codes (ref_userid format)
- [ ] Parse deep link parameters (t.me/bot?start=ref_xyz)
- [ ] Create referral tracking on new user registration
- [ ] Update status PENDING → COMPLETED when referee finishes test
- [ ] Award points to both referrer (+50) and referee (+25)
- [ ] Track milestone progress (3, 5, 10 referrals)
- [ ] Award referral badges at milestones
- [ ] Create shareable results card (1080x1080px image)

### Phase 4: Achievement System (Week 3)

- [ ] Create Achievement table (Prisma migration)
- [ ] Define all BadgeType enum values
- [ ] Implement achievement unlock logic
- [ ] Send congratulations message with badge image
- [ ] Store achievements in Achievement table
- [ ] Display earned achievements (/achievements command)
- [ ] Implement hidden easter egg detection
  - Night Owl (11pm-2am)
  - Early Bird (5am-7am)
  - Detective (question 33 hint)
  - Birthday bonus

### Phase 5: Progress & Retention (Week 3)

- [ ] Segmented progress bar display
- [ ] Section completion celebration messages
- [ ] Motivational messages at Q10, Q15, Q28, Q40, Q50
- [ ] Real-time insight teasers (after Sections 2, 3, 4)
- [ ] Time estimate display ("⏱️ About 8 minutes remaining")
- [ ] Auto-save after every question (Telegram Cloud Storage)

### Phase 6: Leaderboards (Optional, Week 4)

- [ ] Weekly leaderboard (top 10 users by points)
- [ ] Percentile display ("You're in top 15% this week")
- [ ] Class/school leaderboards (opt-in, privacy-protected)
- [ ] Anonymous leaderboard option (display rank without names)

---

## 8. Success Metrics & KPIs

### Engagement Metrics

**Primary KPIs**:
- **Test Completion Rate**: Target 70%+ (vs industry average 50-60%)
- **Time to Complete**: Target 12-15 minutes (optimal engagement)
- **Drop-Off Rate Per Section**:
  - Section 1: <5% drop-off
  - Section 2: <10% cumulative
  - Section 3: <15% cumulative
  - Sections 4-5: <20% cumulative

**Secondary KPIs**:
- **Daily Active Users** (users with qualifying activity)
- **Weekly Streak Participation**: % users with 3+ day streak
- **Perfect Week Achievement**: % users completing 7/7 days
- **Return Rate**: % users who revisit results or retake test

### Viral Metrics

**Referral Performance**:
- **Referral Conversion Rate**: % of referred users who complete test (Target: 50%+)
- **Viral Coefficient**: New users per existing user (Target: >1.0 by Month 3)
- **Share Rate**: % who share results (Target: 30%+)
- **Top Referrers**: Identify and reward super advocates

**Referral Funnel**:
```
1000 users → 300 share link (30% share rate)
             → 450 clicks (1.5 clicks per share)
             → 225 signups (50% conversion)
             → 158 completions (70% completion)

Viral Coefficient = 158 / 1000 = 0.158 (Month 1 baseline)
Target by Month 3: >1.0
```

### Badge & Achievement Metrics

- **Badge Earning Rate**: Average badges per user (Target: 4-6)
- **Hidden Badge Discovery**: % users who find easter eggs (Target: 15-20%)
- **Achievement Diversity**: Distribution across badge types (avoid concentration)
- **Milestone Completion**:
  - % reaching 3 referrals (unlock Career Comparison)
  - % reaching 5 referrals (free consultation)
  - % reaching 10 referrals (premium access)

---

## 9. Budget-Friendly Implementation

### Design Assets Needed

**Required Images** (512x512px, PNG with transparency):
| Asset | Quantity | Design Tool | Est. Cost |
|-------|----------|-------------|-----------|
| Progress badges | 4 (Bronze, Silver, Gold, Platinum) | Canva / Fiverr | 2,000₽ |
| Streak icons | 3 (Flame, Star, Crown) | Canva free | 0₽ |
| Referral badges | 3 (Bronze, Silver, Gold medal) | Canva free | 0₽ |
| Easter egg badges | 6 (Owl, Bird, Detective, etc.) | Canva / Figma | 1,000₽ |
| **Total** | **16 badges** | | **3,000₽** |

**Shareable Results Card** (1080x1080px):
- Template design: Canva free or Figma
- Dynamic generation: Chart.js + Canvas API (free)
- Personality archetype avatars: 12 unique icons (can use free icon sets)

### Infrastructure Costs

**MVP (Month 1)**:
| Service | Usage | Cost |
|---------|-------|------|
| Telegram Bot API | Unlimited | Free |
| Database (PostgreSQL) | Supabase free tier (500 MB) | Free |
| Image Storage | Supabase Storage (1 GB) | Free |
| Badge Generation | Server-side (Chart.js) | Free |
| Cron Jobs (weekly reset) | Supabase Edge Functions | Free |
| **Total Monthly** | | **0₽** |

**Infrastructure scales for free up to:**
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users (Supabase free tier limit)

---

## 10. Anti-Patterns to Avoid

### What NOT to Do

**❌ Over-Gamification**:
- Don't add so many points/badges that they lose meaning
- Don't make career guidance feel like a silly game
- Balance: Fun mechanics serve serious purpose (career discovery)

**❌ Fake Scarcity**:
- Don't show "Only 3 spots left!" if it's always 3 spots
- Authentic urgency only (real limited-time offers)

**❌ Pay-to-Win**:
- Points should reflect actual achievement, not purchases
- Rewards unlock through engagement, not payment

**❌ Complexity**:
- Don't require user to understand complex point formulas
- Keep mechanics intuitive ("Do test → Get points → Unlock stuff")

**❌ Neglecting Core Value**:
- Gamification enhances assessment, doesn't replace it
- Results quality >> flashy badges

---

## 11. A/B Testing Opportunities

### Recommended Experiments

**Test 1: Referral Reward Amount**:
- Variant A: +50 points referrer, +25 referee (current)
- Variant B: +75 points referrer, +25 referee
- Variant C: +50 points referrer, +50 referee (equal)
- **Hypothesis**: Equal rewards increase referee motivation
- **Metric**: Referral completion rate

**Test 2: Streak Reset Timing**:
- Variant A: Weekly reset (Monday, current)
- Variant B: Monthly reset (1st of month)
- Variant C: No reset (cumulative forever)
- **Hypothesis**: Weekly creates sustainable habit vs burnout
- **Metric**: Streak participation rate

**Test 3: Progress Bar Style**:
- Variant A: Percentage (35%)
- Variant B: Fraction (19/55)
- Variant C: Visual bar (⬛⬛⬛⬜⬜)
- **Hypothesis**: Visual bar reduces perceived complexity
- **Metric**: Completion rate

**Test 4: Badge Unlock Timing**:
- Variant A: Immediate (current)
- Variant B: Delayed reveal (at end of test)
- Variant C: Daily digest (all badges in one message)
- **Hypothesis**: Immediate creates momentum
- **Metric**: Section completion rate

---

## 12. Future Enhancements (Post-MVP)

### Advanced Features (Month 2+)

**Social Leaderboards**:
- Class competition mode
- School-wide rankings
- Regional leaderboards (Moscow, St. Petersburg, etc.)
- Privacy-protected (anonymous ranks optional)

**Seasonal Events**:
- Back-to-School bonus week (September)
- New Year resolution challenge (January)
- Exam season support (May-June)
- Summer career exploration (July-August)

**Premium Gamification**:
- Exclusive badges for paid tier
- Advanced analytics dashboard
- Custom achievement challenges
- Personalized milestone goals

**Team Challenges**:
- Study group competitions
- Parent-child challenges
- Classroom vs classroom
- Friend group leaderboards

**Integration with Learning**:
- Points for completing recommended courses
- Badges for skill development milestones
- Career pathway progress tracking
- University application checklist gamification

---

## 13. Conclusion

This gamification strategy combines proven EdTech best practices with innovative mechanics (progressive weekly streak) to maximize engagement and viral growth. Key differentiators:

1. **Progressive Streak Bonus**: Unique mechanic creates both positive reinforcement (growing rewards) and FOMO (fear of losing progress)
2. **Dual-Sided Referrals**: Both referrer and referee benefit, increasing conversion
3. **Easter Eggs**: Hidden achievements create delight and word-of-mouth marketing
4. **Budget-Friendly**: Entire system costs <3,000₽ to design and 0₽/month to operate

**Implementation Priority**:
- **Week 2**: Core points, badges, streaks, referrals (MUST-HAVE)
- **Week 3**: Achievements, easter eggs, progress messages (NICE-TO-HAVE)
- **Week 4**: Leaderboards, A/B testing (OPTIONAL)

**Success Definition**:
- Month 1: 70% completion rate, 0.5 viral coefficient
- Month 3: 75% completion rate, 1.0 viral coefficient
- Month 6: 80% completion rate, 1.5 viral coefficient, 10,000+ users

Focus on simplicity, delight, and proven psychology. Ship MVP fast, measure ruthlessly, iterate based on data. Good luck! 🚀
