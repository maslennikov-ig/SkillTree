# API Endpoints Contract: SkillTree Telegram Bot

**Feature**: `002-telegram-bot-mvp` | **Date**: 2025-12-28

---

## Base Configuration

```
Base URL: https://api.skilltree.app/v1
Content-Type: application/json
Authentication: Internal service tokens (bot→API communication)
```

---

## Results Module

### GET /results/:sessionId/radar-chart

Generate or retrieve RIASEC radar chart for a completed session.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| sessionId | path | string | Yes | TestSession ID |
| size | query | number | No | 600 (default) or 1080 |

**Response**:
```
Content-Type: image/png
Content-Length: {bytes}
Cache-Control: public, max-age=86400

[Binary PNG data]
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 400 | SESSION_NOT_COMPLETED | Session not yet completed |
| 500 | CHART_GENERATION_FAILED | Canvas rendering error |

**Example**:
```bash
curl -X GET "https://api.skilltree.app/v1/results/clx123/radar-chart?size=600" \
  -H "Authorization: Bearer {token}" \
  --output chart.png
```

---

### GET /results/:sessionId/share-card

Generate shareable Instagram/Stories card (1080x1080).

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| sessionId | path | string | Yes | TestSession ID |
| userName | query | string | No | Name to display on card |

**Response**:
```
Content-Type: image/png
Content-Length: {bytes}
Cache-Control: public, max-age=3600

[Binary PNG data - 1080x1080]
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 400 | SESSION_NOT_COMPLETED | Session not yet completed |
| 500 | CARD_GENERATION_FAILED | Canvas rendering error |

**Example**:
```bash
curl -X GET "https://api.skilltree.app/v1/results/clx123/share-card?userName=Алексей" \
  -H "Authorization: Bearer {token}" \
  --output card.png
```

---

### POST /results/:sessionId/email-report

Send professional results report to parent email.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| sessionId | path | string | Yes | TestSession ID |

**Request Body**:
```json
{
  "parentEmail": "parent@example.com",
  "studentName": "Алексей",
  "includeConsultationCTA": true
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "sendpulse_msg_123",
  "sentAt": "2025-12-28T10:30:00Z"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 400 | SESSION_NOT_COMPLETED | Session not yet completed |
| 400 | INVALID_EMAIL | Email format invalid |
| 429 | RATE_LIMITED | Too many email requests |
| 503 | EMAIL_SERVICE_UNAVAILABLE | SendPulse API error |

**Email Template Variables**:
```typescript
interface ParentReportData {
  studentName: string;
  radarChartUrl: string;
  hollandCode: string;
  personalityType: string;
  topCareers: Array<{
    titleRu: string;
    matchPercentage: number;
    salaryRange: string;
    outlook: string;
  }>;
  strengths: string[];
  developmentAreas: string[];
  consultationUrl: string;
}
```

---

### GET /results/:sessionId/pdf-roadmap

Generate or retrieve personalized PDF career roadmap (requires 1000+ points).

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| sessionId | path | string | Yes | TestSession ID |
| userId | query | string | Yes | User ID for points verification |

**Response**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="career-roadmap-{sessionId}.pdf"
Content-Length: {bytes}

[Binary PDF data]
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 400 | SESSION_NOT_COMPLETED | Session not yet completed |
| 403 | INSUFFICIENT_POINTS | User has less than 1000 points |
| 500 | PDF_GENERATION_FAILED | PDFKit rendering error |

**PDF Contents**:
- Cover page with student name and test date
- RIASEC radar chart (embedded PNG)
- Personality type description
- Top 5 career matches with salary ranges
- Development roadmap steps for top career
- Recommended universities
- QR code linking to SkillTree consultation

**Example**:
```bash
curl -X GET "https://api.skilltree.app/v1/results/clx123/pdf-roadmap?userId=clx789" \
  -H "Authorization: Bearer {token}" \
  --output roadmap.pdf
```

---

### GET /results/:sessionId/careers

Get career matches for a completed session.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| sessionId | path | string | Yes | TestSession ID |
| limit | query | number | No | Number of results (default: 5, max: 10) |

**Response**:
```json
{
  "matches": [
    {
      "career": {
        "id": "clx456",
        "title": "Data Scientist",
        "titleRu": "Дата-сайентист",
        "category": "technology",
        "salaryMin": 180000,
        "salaryMax": 450000,
        "outlook": "growing",
        "demandLevel": "high"
      },
      "correlation": 0.847,
      "matchPercentage": 92,
      "matchCategory": "Best Fit"
    }
  ],
  "totalCareers": 43,
  "userProfile": {
    "R": 45,
    "I": 88,
    "A": 62,
    "S": 34,
    "E": 51,
    "C": 78
  }
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | SESSION_NOT_FOUND | Session doesn't exist |
| 400 | SESSION_NOT_COMPLETED | Session not yet completed |

---

## Email Module

### POST /email/verify

Initiate email verification for parent.

**Request Body**:
```json
{
  "userId": "clx789",
  "email": "parent@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "verificationId": "clx_verify_123",
  "expiresAt": "2025-12-28T10:45:00Z",
  "maskedEmail": "p***t@example.com"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_EMAIL | Email format invalid |
| 429 | RATE_LIMITED | Max 3 attempts per hour |
| 503 | EMAIL_SERVICE_UNAVAILABLE | SendPulse API error |

**Verification Email**:
```
Subject: Код подтверждения: {code}
From: noreply@skilltree.ru
To: {email}

Body: "Ваш код подтверждения: {4-digit code}
Действителен 15 минут."
```

---

### POST /email/confirm

Confirm email verification code.

**Request Body**:
```json
{
  "userId": "clx789",
  "code": "1234"
}
```

**Response**:
```json
{
  "success": true,
  "verified": true,
  "email": "parent@example.com"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_CODE | Code doesn't match |
| 400 | CODE_EXPIRED | Code has expired (15 min) |
| 404 | VERIFICATION_NOT_FOUND | No pending verification |

---

## Careers Module

### GET /careers

List all available careers.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| category | query | string | No | Filter by category |
| outlook | query | string | No | Filter by outlook |
| limit | query | number | No | Limit results (default: 43) |
| offset | query | number | No | Pagination offset |

**Response**:
```json
{
  "careers": [
    {
      "id": "clx456",
      "title": "Data Scientist",
      "titleRu": "Дата-сайентист",
      "description": "Анализ данных и машинное обучение",
      "riasecProfile": { "R": 30, "I": 90, "A": 35, "S": 25, "E": 30, "C": 75 },
      "salaryMin": 180000,
      "salaryMax": 450000,
      "salarySource": "hh.ru 2024",
      "category": "technology",
      "requiredSkills": ["Python", "SQL", "Statistics"],
      "educationPath": ["Mathematics", "ML Online Courses"],
      "universities": ["MSU", "MIPT", "HSE"],
      "outlook": "growing",
      "demandLevel": "high"
    }
  ],
  "total": 43,
  "categories": ["technology", "creative", "business", "medicine", "science", "engineering", "social"]
}
```

---

### GET /careers/:id

Get detailed career information.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| id | path | string | Yes | Career ID |

**Response**:
```json
{
  "id": "clx456",
  "title": "Data Scientist",
  "titleRu": "Дата-сайентист",
  "description": "Специалист по анализу данных и машинному обучению...",
  "riasecProfile": { "R": 30, "I": 90, "A": 35, "S": 25, "E": 30, "C": 75 },
  "salaryMin": 180000,
  "salaryMax": 450000,
  "salarySource": "hh.ru 2024",
  "category": "technology",
  "requiredSkills": ["Python", "SQL", "Statistics", "Machine Learning"],
  "educationPath": [
    "Математика и статистика в школе",
    "Профильный ВУЗ (Прикладная математика)",
    "Онлайн-курсы по ML/DS"
  ],
  "universities": ["МГУ", "МФТИ", "ВШЭ", "ИТМО"],
  "outlook": "growing",
  "demandLevel": "high",
  "relatedCareers": ["clx457", "clx458"]
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | CAREER_NOT_FOUND | Career doesn't exist |

---

## Gamification Module

### GET /gamification/unlocks

Get unlocked features for user.

**Parameters**:
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| userId | query | string | Yes | User ID |

**Response**:
```json
{
  "totalPoints": 1250,
  "unlocked": [
    {
      "feature": "CAREER_COMPARISON",
      "points": 500,
      "unlockedAt": "2025-12-28T10:00:00Z"
    },
    {
      "feature": "PDF_ROADMAP",
      "points": 1000,
      "unlockedAt": "2025-12-28T11:00:00Z"
    }
  ],
  "nextUnlock": {
    "feature": "FREE_CONSULTATION",
    "points": 2000,
    "pointsNeeded": 750
  }
}
```

---

### POST /gamification/award

Award points to user (internal API).

**Request Body**:
```json
{
  "userId": "clx789",
  "points": 50,
  "reason": "REFERRAL_COMPLETED",
  "metadata": {
    "refereeId": "clx_referee"
  }
}
```

**Response**:
```json
{
  "success": true,
  "newTotal": 1300,
  "newUnlocks": []
}
```

---

## Internal APIs (Bot→API)

### POST /internal/calculate-results

Calculate RIASEC profile and career matches from answers.

**Request Body**:
```json
{
  "sessionId": "clx123",
  "answers": {
    "q1": "r1",
    "q2": "i2",
    "q3": 4,
    "q55": "yes"
  }
}
```

**Response**:
```json
{
  "riasecProfile": { "R": 45, "I": 88, "A": 62, "S": 34, "E": 51, "C": 78 },
  "hollandCode": "ICA",
  "personalityType": "Креативный исследователь",
  "personalityEmoji": "",
  "topCareers": [
    {
      "careerId": "clx456",
      "correlation": 0.847,
      "matchPercentage": 92,
      "matchCategory": "Best Fit"
    }
  ],
  "strengths": ["Аналитическое мышление", "Креативность", "Внимание к деталям"],
  "developmentAreas": ["Навыки презентации", "Работа в команде"]
}
```

---

### POST /internal/check-badge

Check if user earned a new badge.

**Request Body**:
```json
{
  "userId": "clx789",
  "trigger": "QUESTION_ANSWERED",
  "metadata": {
    "questionNumber": 14,
    "totalQuestions": 55,
    "sessionId": "clx123"
  }
}
```

**Response**:
```json
{
  "newBadges": [
    {
      "badgeType": "BRONZE_EXPLORER",
      "earnedAt": "2025-12-28T10:15:00Z",
      "points": 0
    }
  ],
  "pointsAwarded": 10
}
```

---

## Type Definitions

```typescript
// Request/Response DTOs

interface CareerMatchResult {
  career: Career;
  correlation: number;       // -1 to 1
  matchPercentage: number;   // 0 to 100
  matchCategory: 'Best Fit' | 'Great Fit' | 'Good Fit' | 'Poor Fit';
}

interface RIASECProfile {
  R: number;  // 0-100
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

interface EmailReportRequest {
  parentEmail: string;
  studentName: string;
  includeConsultationCTA?: boolean;
}

interface VerificationRequest {
  userId: string;
  email: string;
}

interface ConfirmationRequest {
  userId: string;
  code: string;
}

interface PointsAwardRequest {
  userId: string;
  points: number;
  reason: string;
  metadata?: Record<string, unknown>;
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Test session not found",
    "details": {
      "sessionId": "clx123"
    }
  },
  "timestamp": "2025-12-28T10:30:00Z",
  "requestId": "req_abc123"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /email/verify | 3 | 1 hour |
| POST /results/:id/email-report | 5 | 1 hour |
| GET /results/:id/share-card | 10 | 1 hour |
| GET /careers | 100 | 1 minute |
| POST /internal/* | 1000 | 1 minute |

---

## Authentication

### Internal Service Communication (Bot→API)

```
Authorization: Bearer {INTERNAL_API_TOKEN}
X-Service-Name: skilltree-bot
X-Request-ID: {uuid}
```

### Token Validation

```typescript
// API middleware
async function validateInternalToken(req: Request): Promise<boolean> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token === process.env.INTERNAL_API_TOKEN;
}
```

---

**Document Status**: Complete
**Next**: Generate quickstart.md
