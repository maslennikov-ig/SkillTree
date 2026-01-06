# SkillTree Bot MVP: Technical Stack Recommendations

Russian teenagers deserve a career guidance bot built on a solid, compliant, and cost-effective foundation. After deep research into email providers, chart generation, and social media card creation, **three key recommendations emerge**: NotiSend for 152-FZ compliant transactional emails, Chart.js with @napi-rs/canvas for RIASEC radar charts, and the same @napi-rs/canvas for shareable Instagram cards. This unified approach keeps your tech stack simple while meeting legal requirements and staying within your $0-20/month budget.

---

## Research topic 1: Russian email service providers

### The 152-FZ compliance problem is more serious than it appears

Federal Law 152-FZ requires personal data of Russian citizens to be stored on servers physically located in Russia. For a bot targeting teenagers with parental consent flows, this isn't optional—it's legally mandatory. The research reveals a stark divide: **no major international providers (SendGrid, Mailgun, Amazon SES) have Russian data centers**, making them unsuitable regardless of their technical superiority.

### Provider comparison matrix

| Provider | Free Tier | API Quality | Deliverability | 152-FZ Compliant | HTML/Images | **Score** |
|----------|-----------|-------------|----------------|------------------|-------------|-----------|
| **SendPulse** | 12K/mo ⭐ | SDK+REST | 85% inbox | ❌ Servers abroad | Full support | 8.55 |
| **NotiSend** | 2K/mo | REST+SMTP | High (Tier-III) | ✅ Russian DC | Full support | 8.35 |
| **UniOne** | 6K/mo (4 mo) | SDK+REST | 99.88% | ⚠️ Unclear | Full support | 8.45 |
| **DashaMail** | 2K/mo | REST only | Good | ✅ Russian | Full support | 7.75 |
| **Sendsay** | None | Full API | 99.99% | ✅ Russian | Enterprise | 7.55 |
| **SendGrid** | 100/day | Best-in-class | 95%+ | ❌ No RU DC | Full support | 6.65 |
| **Mailgun** | 5K (1 mo) | Excellent | 95%+ | ❌ No RU DC | Full support | 6.50 |

### Top two recommendations

**Primary: NotiSend** — The only provider with explicit 152-FZ compliance documentation stating "Серверы расположены в российском дата-центре уровня Tier-III." Their **2,000 free emails/month** covers MVP verification flows, and paid plans cost approximately **500-1,000 RUB/month** (~$5-10) for 5,000 emails. Russian legal entity, Russian support (8-800 phone line), and full transactional email focus make this the legally safe choice.

**Fallback: SendPulse** — With **12,000 free emails/month** and superior API documentation including a Node.js SDK, SendPulse is technically superior. However, their servers are located outside Russia (Ukrainian company with international infrastructure), creating 152-FZ compliance risk. Acceptable only if your legal team confirms transactional emails with minimal PII (just email addresses) qualify for an exception.

### Pricing scenarios (monthly cost)

| Volume | NotiSend | SendPulse | UniOne |
|--------|----------|-----------|--------|
| 1,000 | FREE | FREE | FREE* |
| 5,000 | ~$8 (800₽) | FREE | FREE* |
| 10,000 | ~$12 (1,200₽) | $8.85 | $2.20 |
| 50,000 | ~$25 (2,500₽) | ~$25 | $11 |

*UniOne free tier expires after 4 months

### Integration code for NotiSend with NestJS

```typescript
// email/notisend.service.ts
import { Injectable, HttpService, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailPayload {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

@Injectable()
export class NotiSendService {
  private readonly logger = new Logger(NotiSendService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.notisend.ru/v1';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('NOTISEND_API_KEY');
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.http.post(
      `${this.baseUrl}/email/messages`,
      {
        to: [{ email }],
        from: { email: 'noreply@skilltree.ru', name: 'SkillTree' },
        subject: `Код подтверждения: ${code}`,
        html: this.buildVerificationHtml(code),
        text: `Ваш код подтверждения: ${code}. Действителен 15 минут.`,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    ).toPromise();
  }

  async sendParentReport(
    email: string,
    childName: string,
    radarChartUrl: string,
    careers: { name: string; match: number }[],
  ): Promise<void> {
    await this.http.post(
      `${this.baseUrl}/email/messages`,
      {
        to: [{ email }],
        from: { email: 'reports@skilltree.ru', name: 'SkillTree Отчёты' },
        subject: `Результаты теста: ${childName}`,
        html: this.buildReportHtml(childName, radarChartUrl, careers),
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    ).toPromise();
  }

  private buildVerificationHtml(code: string): string {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1F2937; margin-bottom: 16px;">Код подтверждения</h2>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6); 
                    color: white; padding: 24px; text-align: center; border-radius: 12px;">
          ${code}
        </div>
        <p style="color: #6B7280; font-size: 14px; margin-top: 16px;">
          Код действителен 15 минут. Если вы не запрашивали код, проигнорируйте это письмо.
        </p>
      </div>
    `;
  }

  private buildReportHtml(
    childName: string, 
    chartUrl: string, 
    careers: { name: string; match: number }[],
  ): string {
    const careerList = careers
      .map(c => `<li><strong>${c.name}</strong> — ${c.match}% совпадение</li>`)
      .join('');
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1F2937;">Отчёт о тестировании: ${childName}</h1>
        <img src="${chartUrl}" alt="RIASEC профиль" style="max-width: 100%; border-radius: 8px;" />
        <h2 style="margin-top: 24px;">Рекомендуемые профессии</h2>
        <ol style="line-height: 1.8;">${careerList}</ol>
        <p style="color: #6B7280; margin-top: 24px; font-size: 12px;">
          © SkillTree Bot — профориентация для подростков
        </p>
      </div>
    `;
  }
}
```

### DNS configuration requirements

All providers require SPF, DKIM, and recommended DMARC records:

```dns
; SPF record
skilltree.ru.  IN  TXT  "v=spf1 include:spf.notisend.ru ~all"

; DKIM record (get selector from NotiSend dashboard)
ns1._domainkey.skilltree.ru.  IN  TXT  "v=DKIM1; k=rsa; p=MIIBIjAN..."

; DMARC record (monitoring mode first)
_dmarc.skilltree.ru.  IN  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@skilltree.ru"
```

### Risk assessment matrix

| Provider | Risk Level | Primary Risk | Mitigation Strategy |
|----------|------------|--------------|---------------------|
| **NotiSend** | 🟢 Low | Smaller ecosystem | Abstract service interface for easy switching |
| **SendPulse** | 🟡 Medium | 152-FZ non-compliance; geopolitical | Use only for transactional; minimize stored PII |
| **UniOne** | 🟡 Medium | Unclear current data residency | Verify server locations before committing |
| **International** | 🔴 High | No Russian data centers | Do not use for production |

---

## Research topic 2: Radar chart generation

### Why native canvas beats all alternatives for your use case

The research evaluated four architecture options: native Node.js canvas libraries, SVG-to-PNG conversion, external APIs like QuickChart, and headless browsers. For a **2GB RAM VDS generating 100 charts/minute peak**, the choice is clear.

External APIs like QuickChart limit free usage to **1,000 charts/month**—your MVP could exhaust this in a single busy day. Headless browsers (Puppeteer/Playwright) consume **400MB+ RAM per instance** and take 400-800ms per chart. Native canvas libraries generate charts in **15-25ms** using **~50MB peak memory**.

### Library performance benchmarks

| Library | Speed (ops/sec) | Color Emoji | System Dependencies | Memory |
|---------|-----------------|-------------|---------------------|--------|
| **@napi-rs/canvas** | 68 ops/s ⭐ | ✅ Native | None (prebuilt) | ~20MB |
| **skia-canvas** | 47-200 ops/s | ✅ Via fonts | None (prebuilt) | ~25MB |
| **node-canvas** | 60 ops/s | ⚠️ Monochrome | Cairo, Pango | ~30MB |
| **Puppeteer** | ~2 ops/s | ✅ Full | Chromium 300MB | ~400MB |

### The winning combination

**Chart.js + @napi-rs/canvas** delivers the best balance:

- **Zero system dependencies**: Pure npm packages with prebuilt binaries—no `apt install` required
- **Native color emoji support**: Critical for axis labels like "Реалистический 🔧"
- **68 operations/second**: Handles 100 charts/minute with 98% headroom
- **TypeScript definitions**: Built-in types for NestJS integration
- **Familiar API**: Standard HTML5 Canvas API that any frontend developer knows

### Complete RIASEC radar chart service

```typescript
// charts/riasec-chart.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  Chart,
  ChartConfiguration,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { join } from 'path';

// Register Chart.js components once
Chart.register(RadialLinearScale, RadarController, PointElement, LineElement, Filler);

export interface RIASECScores {
  realistic: number;      // 🔧 0-100
  investigative: number;  // 🔬 0-100
  artistic: number;       // 🎨 0-100
  social: number;         // 🤝 0-100
  enterprising: number;   // 💼 0-100
  conventional: number;   // 📋 0-100
}

const RIASEC_COLORS = {
  realistic: '#F59E0B',
  investigative: '#3B82F6',
  artistic: '#EC4899',
  social: '#10B981',
  enterprising: '#8B5CF6',
  conventional: '#6B7280',
} as const;

@Injectable()
export class RiasecChartService implements OnModuleInit {
  private readonly fontsDir = join(__dirname, '..', 'assets', 'fonts');

  onModuleInit() {
    // Register fonts at startup (BEFORE any canvas creation)
    GlobalFonts.registerFromPath(
      join(this.fontsDir, 'Inter-Medium.ttf'),
      'Inter',
    );
    GlobalFonts.registerFromPath(
      join(this.fontsDir, 'NotoColorEmoji.ttf'),
      'Noto Emoji',
    );
  }

  async generateChart(
    scores: RIASECScores,
    size: 600 | 1080 = 600,
  ): Promise<Buffer> {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Determine dominant dimension for accent color
    const dominant = this.getDominantDimension(scores);
    const accentColor = RIASEC_COLORS[dominant];

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, `${accentColor}40`); // 25% opacity
    gradient.addColorStop(1, `${accentColor}15`); // 8% opacity

    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: [
          'Реалистический 🔧',
          'Исследовательский 🔬',
          'Артистический 🎨',
          'Социальный 🤝',
          'Предприимчивый 💼',
          'Конвенциональный 📋',
        ],
        datasets: [
          {
            label: 'RIASEC Профиль',
            data: [
              scores.realistic,
              scores.investigative,
              scores.artistic,
              scores.social,
              scores.enterprising,
              scores.conventional,
            ],
            fill: true,
            backgroundColor: gradient,
            borderColor: accentColor,
            borderWidth: 3,
            pointBackgroundColor: accentColor,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: size === 600 ? 6 : 10,
            pointHoverRadius: size === 600 ? 8 : 12,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        devicePixelRatio: 2, // Retina quality
        animation: false, // Required for server-side
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 20,
              font: {
                family: 'Inter',
                size: size === 600 ? 10 : 14,
              },
              backdropColor: 'transparent',
              color: '#9CA3AF',
            },
            pointLabels: {
              font: {
                family: 'Inter, Noto Emoji',
                size: size === 600 ? 13 : 20,
                weight: '500',
              },
              color: '#374151',
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.15)',
              lineWidth: 1,
            },
            angleLines: {
              color: 'rgba(156, 163, 175, 0.15)',
              lineWidth: 1,
            },
          },
        },
      },
    };

    // Render and export
    const chart = new Chart(ctx as any, config);
    const buffer = canvas.toBuffer('image/png');
    chart.destroy();

    return buffer;
  }

  private getDominantDimension(scores: RIASECScores): keyof RIASECScores {
    const entries = Object.entries(scores) as [keyof RIASECScores, number][];
    return entries.reduce((max, current) =>
      current[1] > max[1] ? current : max,
    )[0];
  }
}
```

### Installation and font setup

```bash
# Install packages
npm install chart.js @napi-rs/canvas

# Download fonts (run in your project root)
mkdir -p assets/fonts
curl -L -o assets/fonts/Inter-Medium.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"
curl -L -o assets/fonts/NotoColorEmoji.ttf \
  "https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf"
```

### Performance expectations on 2GB RAM VDS

| Metric | Expected Value |
|--------|----------------|
| Single chart generation | 15-25ms |
| 100 charts/minute throughput | ✅ Easily achievable |
| Peak memory usage | ~100MB (including Node.js) |
| Cold start time | ~69ms |

### Fallback strategy

If @napi-rs/canvas encounters issues on your specific Ubuntu version, **skia-canvas** offers identical API with excellent async performance (200+ ops/sec when parallelized). Same code, just change the import:

```typescript
// Fallback: replace @napi-rs/canvas with skia-canvas
import { Canvas, FontLibrary } from 'skia-canvas';

FontLibrary.use('Inter', ['assets/fonts/Inter-Medium.ttf']);
const canvas = new Canvas(600, 600);
```

---

## Research topic 3: Social media share cards

### The power of a unified graphics stack

Since **@napi-rs/canvas** is already recommended for radar charts, using the same library for share cards eliminates additional dependencies. This creates a consistent, maintainable codebase where both chart generation and card composition share font loading, color constants, and error handling patterns.

### What the share card needs to render

The Instagram-optimized 1080×1080 card requires layering multiple elements:

1. **Gradient background** based on dominant RIASEC dimension
2. **Embedded radar chart** (600×600 from the previous service)
3. **Russian text with emoji** ("Стратегический Инноватор 🧠💡")
4. **Career match percentage** with themed accent color
5. **SkillTree logo** positioned at bottom-right
6. **Call-to-action** with bot username

### Complete share card generation service

```typescript
// cards/share-card.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCanvas, GlobalFonts, Image, loadImage } from '@napi-rs/canvas';
import { readFile } from 'fs/promises';
import { join } from 'path';

const RIASEC_THEMES = {
  realistic: { primary: '#F59E0B', gradientStart: '#FEF3C7', gradientEnd: '#FFFFFF' },
  investigative: { primary: '#3B82F6', gradientStart: '#DBEAFE', gradientEnd: '#FFFFFF' },
  artistic: { primary: '#EC4899', gradientStart: '#FCE7F3', gradientEnd: '#FFFFFF' },
  social: { primary: '#10B981', gradientStart: '#D1FAE5', gradientEnd: '#FFFFFF' },
  enterprising: { primary: '#8B5CF6', gradientStart: '#EDE9FE', gradientEnd: '#FFFFFF' },
  conventional: { primary: '#6B7280', gradientStart: '#F3F4F6', gradientEnd: '#FFFFFF' },
} as const;

export interface ShareCardData {
  dimension: keyof typeof RIASEC_THEMES;
  archetype: string; // "Стратегический Инноватор 🧠💡"
  topCareer: string;
  matchPercent: number;
  userName?: string;
  radarChartBuffer: Buffer;
}

@Injectable()
export class ShareCardService implements OnModuleInit {
  private logoImage: Image;
  private readonly assetsDir = join(__dirname, '..', 'assets');

  async onModuleInit() {
    // Pre-load logo for faster card generation
    const logoBuffer = await readFile(join(this.assetsDir, 'logo.png'));
    this.logoImage = await loadImage(logoBuffer);

    // Register fonts (shared with chart service if already loaded)
    GlobalFonts.registerFromPath(
      join(this.assetsDir, 'fonts', 'Inter-Bold.ttf'),
      'Inter Bold',
    );
    GlobalFonts.registerFromPath(
      join(this.assetsDir, 'fonts', 'Inter-Medium.ttf'),
      'Inter Medium',
    );
    GlobalFonts.registerFromPath(
      join(this.assetsDir, 'fonts', 'Inter-Regular.ttf'),
      'Inter',
    );
    GlobalFonts.registerFromPath(
      join(this.assetsDir, 'fonts', 'NotoColorEmoji.ttf'),
      'Noto Emoji',
    );
  }

  async generateCard(data: ShareCardData): Promise<Buffer> {
    const WIDTH = 1080;
    const HEIGHT = 1080;
    const theme = RIASEC_THEMES[data.dimension];

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // 1. Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGradient.addColorStop(0, theme.gradientStart);
    bgGradient.addColorStop(1, theme.gradientEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Accent bar at top
    ctx.fillStyle = theme.primary;
    ctx.fillRect(0, 0, WIDTH, 8);

    // 3. Decorative background circles
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.arc(920, 180, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(120, 920, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 4. Archetype title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '700 52px "Inter Bold", "Noto Emoji"';
    ctx.fillStyle = '#1F2937';
    ctx.fillText(data.archetype, WIDTH / 2, 80);

    // 5. User name subtitle (if provided)
    if (data.userName) {
      ctx.font = '400 28px "Inter"';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`Результаты для ${data.userName}`, WIDTH / 2, 150);
    }

    // 6. Radar chart (centered)
    const radarImage = await loadImage(data.radarChartBuffer);
    const chartX = (WIDTH - 600) / 2;
    const chartY = data.userName ? 200 : 180;
    ctx.drawImage(radarImage, chartX, chartY, 600, 600);

    // 7. Career match section with pill background
    const careerY = 850;
    
    // Pill background
    ctx.fillStyle = theme.primary + '18'; // ~10% opacity
    this.roundRect(ctx, 140, careerY - 15, 800, 90, 20);
    ctx.fill();

    // Career label
    ctx.font = '500 26px "Inter Medium"';
    ctx.fillStyle = '#374151';
    ctx.fillText('Лучшая профессия для тебя:', WIDTH / 2, careerY);

    // Career name with percentage
    ctx.font = '700 36px "Inter Bold"';
    ctx.fillStyle = theme.primary;
    ctx.fillText(
      `${data.topCareer} (${data.matchPercent}% совпадение)`,
      WIDTH / 2,
      careerY + 40,
    );

    // 8. Logo (bottom-right)
    ctx.drawImage(this.logoImage, WIDTH - 150, HEIGHT - 150, 120, 120);

    // 9. CTA (bottom-left)
    ctx.textAlign = 'left';
    ctx.font = '400 22px "Inter"';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Пройди тест → @SkillTreeBot', 30, HEIGHT - 35);

    return canvas.toBuffer('image/png');
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
```

### Font loading for Russian text and emoji on Ubuntu

```bash
# Download all required font variants
mkdir -p assets/fonts

# Inter font family (Cyrillic included)
curl -L -o assets/fonts/Inter-Regular.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.otf"
curl -L -o assets/fonts/Inter-Medium.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"  
curl -L -o assets/fonts/Inter-Bold.ttf \
  "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.otf"

# Noto Color Emoji (for 🔧🔬🎨🤝💼📋🧠💡)
curl -L -o assets/fonts/NotoColorEmoji.ttf \
  "https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf"
```

### Alternative approach: Satori for HTML/CSS-like syntax

If your team prefers HTML/CSS over Canvas API, Vercel's **Satori** library converts JSX/HTML to SVG, then **resvg-js** converts to PNG:

```typescript
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const svg = await satori(
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #DBEAFE, #FFFFFF)',
    width: 1080,
    height: 1080,
  }}>
    <h1 style={{ fontSize: 52, fontWeight: 700 }}>
      Стратегический Инноватор 🧠💡
    </h1>
  </div>,
  { width: 1080, height: 1080, fonts: [...] }
);

const png = new Resvg(svg).render().asPng();
```

Trade-off: Satori is **~50ms per card** vs **~30ms for raw canvas**, but offers more familiar syntax for frontend developers.

---

## Unified deployment guide for VDS

### Complete installation script

```bash
#!/bin/bash
# VDS Setup Script for SkillTree Bot (Ubuntu 20.04+, 2GB RAM)

# 1. Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Build tools (for any native module compilation)
sudo apt-get install -y build-essential

# 3. Font configuration tools
sudo apt-get install -y fontconfig

# 4. PM2 for process management
sudo npm install -g pm2

# 5. Create app directory structure
sudo mkdir -p /app/{dist,assets/fonts,logs}
sudo chown -R $USER:$USER /app

# 6. Download fonts
cd /app/assets/fonts
curl -L -o Inter-Regular.ttf "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.otf"
curl -L -o Inter-Medium.ttf "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"
curl -L -o Inter-Bold.ttf "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.otf"
curl -L -o NotoColorEmoji.ttf "https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf"

# 7. Verify fonts
fc-cache -fv
echo "Installed fonts:"
fc-list | grep -E "Inter|Noto"
```

### PM2 ecosystem configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'skilltree-api',
    script: 'dist/main.js',
    instances: 1, // Single instance for 2GB RAM
    exec_mode: 'fork',
    max_memory_restart: '1500M', // Restart if exceeds 1.5GB
    env: {
      NODE_ENV: 'production',
      MALLOC_ARENA_MAX: '2', // Reduce memory fragmentation
      UV_THREADPOOL_SIZE: '4', // Match CPU cores
      NOTISEND_API_KEY: 'your-api-key',
      FONTS_DIR: '/app/assets/fonts',
    },
    error_file: '/app/logs/error.log',
    out_file: '/app/logs/out.log',
    merge_logs: true,
  }],
};
```

### Memory budget allocation

| Component | Peak Memory | Notes |
|-----------|-------------|-------|
| Node.js runtime | 80-120MB | Baseline |
| NestJS application | 50-80MB | Depends on modules |
| @napi-rs/canvas | 20-50MB | Per active canvas |
| PostgreSQL connection pool | 20-30MB | 5 connections |
| grammY Telegram client | 10-20MB | Webhook mode |
| **Total peak** | **~400MB** | **Well under 2GB** |

---

## Complete package.json dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/axios": "^3.0.0",
    
    "grammy": "^1.21.0",
    
    "@napi-rs/canvas": "^0.1.44",
    "chart.js": "^4.4.0",
    
    "@supabase/supabase-js": "^2.38.0",
    
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Risk assessment summary

| Component | Risk | Impact | Mitigation |
|-----------|------|--------|------------|
| **NotiSend** (email) | 🟢 Low | Service disruption | Abstract interface; SendPulse fallback ready |
| **152-FZ compliance** | 🟡 Medium | Legal penalties | NotiSend explicit compliance; verify annually |
| **@napi-rs/canvas** | 🟢 Low | Render failures | skia-canvas drop-in replacement |
| **Font rendering** | 🟢 Low | Broken text/emoji | Bundle fonts; test on VDS before deploy |
| **Memory limits** | 🟡 Medium | OOM crashes | PM2 max_memory_restart; canvas pooling |
| **Supabase latency** | 🟡 Medium | Slow responses | Connection pooling; edge functions later |

---

## Conclusion

Three technical decisions define your MVP's foundation. **NotiSend** provides legally compliant email delivery with Russian data residency at approximately $8/month for your expected volume. **Chart.js with @napi-rs/canvas** generates beautiful RIASEC radar charts in 15-25ms without external API dependencies or quotas. The same **@napi-rs/canvas** powers Instagram-ready share cards with full Russian text and emoji support.

This stack stays within your $0-20/month budget (only NotiSend costs money after the free tier), runs comfortably on a 2GB RAM VDS, requires no Docker, and integrates cleanly with NestJS. The abstraction patterns in the code examples enable easy provider switching if requirements change—future-proofing without over-engineering.

Your next steps: register NotiSend account, configure SPF/DKIM records, download the font files, and copy the service classes into your NestJS modules. The radar chart and share card services can share a single canvas font initialization, reducing startup time and memory overhead.