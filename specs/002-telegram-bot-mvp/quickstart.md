# Quickstart Guide: SkillTree Telegram Bot MVP

**Feature**: `002-telegram-bot-mvp` | **Date**: 2025-12-28

---

## Prerequisites

Before starting implementation, ensure you have:

- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed
- [ ] Access to Supabase project (MegaCampusAI)
- [ ] Telegram Bot Token from @BotFather
- [ ] SendPulse account and API credentials (12K free emails/month)
- [ ] VDS access (for deployment)

---

## Step 1: Create Bot Package

```bash
# From repository root
mkdir -p apps/bot/src/{handlers,keyboards,services,utils,content}

# Initialize package.json
cd apps/bot
pnpm init
```

**apps/bot/package.json**:
```json
{
  "name": "@skilltree/bot",
  "version": "0.0.1",
  "private": true,
  "main": "dist/bot.js",
  "scripts": {
    "dev": "tsx watch src/bot.ts",
    "build": "tsc",
    "start": "node dist/bot.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "grammy": "^1.21.0",
    "@grammyjs/menu": "^1.2.0",
    "@grammyjs/ratelimiter": "^1.2.0",
    "date-fns": "^3.6.0",
    "@skilltree/database": "workspace:*",
    "@skilltree/shared": "workspace:*",
    "pino": "^8.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

---

## Step 2: Configure TypeScript

**apps/bot/tsconfig.json**:
```json
{
  "extends": "@skilltree/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Step 3: Create Bot Entry Point

**apps/bot/src/bot.ts**:
```typescript
import { Bot, Context, session } from "grammy";
import { PrismaClient } from "@skilltree/database";
import { logger } from "./utils/logger";

// Extended context with quiz session
export interface MyContext extends Context {
  prisma: PrismaClient;
  quizSession?: {
    id: string;
    currentStep: number;
    status: string;
  };
}

const prisma = new PrismaClient();

// Create bot instance
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

// Middleware: Attach Prisma
bot.use(async (ctx, next) => {
  ctx.prisma = prisma;
  await next();
});

// Middleware: Load quiz session
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const session = await prisma.testSession.findFirst({
      where: {
        student: { user: { telegramId: BigInt(ctx.from.id) } },
        status: "IN_PROGRESS"
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (session) {
      // Check 24h timeout
      const hoursInactive = (Date.now() - session.updatedAt.getTime()) / 36e5;

      if (hoursInactive > 24) {
        await prisma.testSession.update({
          where: { id: session.id },
          data: { status: "ABANDONED" }
        });
      } else {
        ctx.quizSession = {
          id: session.id,
          currentStep: session.currentStep,
          status: session.status
        };
      }
    }
  }
  await next();
});

// Register handlers (add as you implement)
// import { startHandler } from "./handlers/start.handler";
// bot.use(startHandler);

// Graceful shutdown
process.once("SIGINT", () => {
  logger.info("Shutting down...");
  bot.stop();
});
process.once("SIGTERM", () => {
  logger.info("Shutting down...");
  bot.stop();
});

// Start bot
async function start() {
  logger.info("Starting bot...");
  await bot.start({
    onStart: () => logger.info("Bot started successfully")
  });
}

start().catch(err => {
  logger.error(err, "Failed to start bot");
  process.exit(1);
});
```

---

## Step 4: Create Logger Utility

**apps/bot/src/utils/logger.ts**:
```typescript
import pino from "pino";

export const logger = pino({
  name: "skilltree-bot",
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty" }
    : undefined
});
```

---

## Step 5: Extend Prisma Schema

Add to **packages/database/prisma/schema.prisma**:

```prisma
// Add to TestSession model
model TestSession {
  // ... existing fields ...
  currentStep    Int      @default(0)
  answeredJSON   Json     @default("{}")
  reminderSentAt DateTime?
  testResult     TestResult?
}

// Add new models (see data-model.md for full schema)
model QuestionOption { ... }
model Career { ... }
model TestResult { ... }
model EmailVerification { ... }
model ParentLinkCode { ... }

// Add to Parent model
model Parent {
  // ... existing fields ...
  emailVerified Boolean @default(false)
}

// Add to Question model
model Question {
  // ... existing fields ...
  primaryDimension String?
  riasecWeights    Json?
  isEasterEgg      Boolean @default(false)
  hint             String?
  options          QuestionOption[]
}
```

---

## Step 6: Run Migrations

```bash
# Generate migration
cd packages/database
pnpm prisma migrate dev --name add_telegram_bot_mvp

# Generate client
pnpm prisma generate
```

---

## Step 7: Seed Question Bank

**packages/database/prisma/seed.ts** (excerpt):
```typescript
import { PrismaClient } from "@prisma/client";
import { questions, careers } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding questions...");

  for (const q of questions) {
    await prisma.question.create({
      data: {
        id: q.id,
        text: q.text,
        questionType: q.type,
        sectionNumber: q.section,
        orderIndex: q.orderIndex,
        difficulty: q.difficulty,
        primaryDimension: q.primaryDimension,
        category: q.primaryDimension, // Legacy field
        isEasterEgg: q.isEasterEgg || false,
        hint: q.hint,
        options: q.options ? {
          create: q.options.map((opt, i) => ({
            text: opt.text,
            value: opt.value,
            scores: opt.scores,
            order: i
          }))
        } : undefined
      }
    });
  }

  console.log("Seeding careers...");

  for (const c of careers) {
    await prisma.career.create({
      data: c
    });
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run: `pnpm prisma db seed`

---

## Step 8: Download Fonts

```bash
# Create fonts directory
mkdir -p apps/api/assets/fonts

# Download Inter font family
curl -L -o apps/api/assets/fonts/Inter-Regular.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.otf"
curl -L -o apps/api/assets/fonts/Inter-Medium.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"
curl -L -o apps/api/assets/fonts/Inter-Bold.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.otf"

# Download Noto Color Emoji
curl -L -o apps/api/assets/fonts/NotoColorEmoji.ttf \
  "https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf"
```

---

## Step 9: Add API Chart Service

**apps/api/src/modules/results/chart.service.ts**:
```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { Chart, ChartConfiguration, RadialLinearScale, RadarController, PointElement, LineElement, Filler } from "chart.js";
import { join } from "path";

Chart.register(RadialLinearScale, RadarController, PointElement, LineElement, Filler);

@Injectable()
export class ChartService implements OnModuleInit {
  private readonly fontsDir = join(__dirname, "..", "..", "assets", "fonts");

  onModuleInit() {
    GlobalFonts.registerFromPath(join(this.fontsDir, "Inter-Medium.ttf"), "Inter");
    GlobalFonts.registerFromPath(join(this.fontsDir, "NotoColorEmoji.ttf"), "Noto Emoji");
  }

  async generateRadarChart(scores: Record<string, number>, size = 600): Promise<Buffer> {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    const config: ChartConfiguration = {
      type: "radar",
      data: {
        labels: ["Реалистический", "Исследовательский", "Артистический", "Социальный", "Предприимчивый", "Конвенциональный"],
        datasets: [{
          label: "RIASEC",
          data: [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C],
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointRadius: 5
        }]
      },
      options: {
        responsive: false,
        animation: false,
        scales: {
          r: { min: 0, max: 100, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    };

    const chart = new Chart(ctx as any, config);
    const buffer = canvas.toBuffer("image/png");
    chart.destroy();

    return buffer;
  }
}
```

---

## Step 10: Environment Variables

Add to **.env**:
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=skilltreebot

# SendPulse Email (12K free/month)
SENDPULSE_API_USER_ID=your_sendpulse_user_id
SENDPULSE_API_SECRET=your_sendpulse_secret
SENDPULSE_FROM_EMAIL=noreply@skilltree.ru

# Feature Flags
ENABLE_EMAIL_REPORTS=true
ENABLE_SHAREABLE_CARDS=true
ENABLE_REFERRAL_SYSTEM=true

# Gamification
SESSION_TIMEOUT_HOURS=24
WEEKLY_RESET_TZ=Europe/Moscow

# Internal API
INTERNAL_API_TOKEN=generate_secure_random_token
```

---

## Step 11: Update Turborepo Config

Add to **turbo.json**:
```json
{
  "pipeline": {
    "bot#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "bot#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

## Step 12: PM2 Configuration

**ecosystem.config.js** (add bot):
```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 4000 }
    },
    {
      name: 'bot',
      script: './apps/bot/dist/bot.js',
      instances: 1,  // Single instance for long polling
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

---

## Verification Checklist

After setup, verify:

- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` passes in all packages
- [ ] `pnpm --filter @skilltree/bot dev` starts bot without errors
- [ ] Bot responds to `/start` in Telegram
- [ ] Prisma migrations applied successfully
- [ ] Questions and careers seeded in database
- [ ] Chart generation works (test with simple endpoint)
- [ ] Font files present in `apps/api/assets/fonts/`

---

## Quick Command Reference

```bash
# Development
pnpm --filter @skilltree/bot dev    # Run bot in dev mode
pnpm --filter @skilltree/api dev    # Run API in dev mode

# Building
pnpm build                          # Build all packages
pnpm --filter @skilltree/bot build  # Build bot only

# Database
pnpm --filter @skilltree/database prisma migrate dev   # Run migrations
pnpm --filter @skilltree/database prisma db seed       # Seed data
pnpm --filter @skilltree/database prisma studio        # Open Prisma Studio

# Type checking
pnpm type-check                     # Check all packages

# Deployment
pm2 start ecosystem.config.js       # Start all services
pm2 restart bot                     # Restart bot only
pm2 logs bot                        # View bot logs
```

---

## Next Steps

1. **Create `/start` handler** with role selection
2. **Create registration conversations** for student/parent
3. **Implement FSM quiz engine** following grammY Deep Think pattern
4. **Add gamification services** (points, badges, streaks)
5. **Integrate chart and card generation**
6. **Add email verification flow**
7. **Test complete user flows**
8. **Deploy to VDS**

---

**Document Status**: Complete
**Ready for**: Task generation (`/speckit.tasks`)
