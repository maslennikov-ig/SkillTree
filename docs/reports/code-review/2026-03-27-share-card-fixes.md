# Code Review Report: Share Card Fixes & PDF Validation

**Date**: 2026-03-27
**Reviewer**: Claude Opus 4.6 (Senior Code Reviewer)
**Scope**: 5 commits on `main` branch (43f2c76..4480b45)
**Files reviewed**: 5 modified/created files

---

## Summary

The changes addressed three issues: (1) broken font path in card.service.ts, (2) poor radar chart visibility on share cards via score rescaling and compact mode, (3) PDF controller rejecting valid CUID session IDs. Additionally, a SendPulse setup instruction document and a beads task for credential configuration were created.

The font path fix and CUID validation fix are correct and necessary. The compact chart rendering is a solid visual improvement. However, there are **1 critical**, **3 important**, and **3 minor** issues that should be addressed.

---

## Commits Reviewed

| Commit | Description |
|--------|-------------|
| `ff9d28e` | Fix font path and rescale radar chart for low-score profiles |
| `43f2c76` | Improve radar chart visibility on Telegram share card |
| `83e18a4` | Accept CUID session IDs in PDF controller validation |
| `1737cca` | Add layout padding so radar chart axis labels are visible |
| `4480b45` | Register fonts in ChartService and set font family for labels |

---

## What Was Done Well

1. **Font path fix is correct**. The old path `../../../../assets/fonts` resolved incorrectly from compiled `dist/modules/results/` to one level above the app root. The new path `../../../assets/fonts` correctly resolves to `apps/api/assets/fonts/`.

2. **CUID+UUID dual regex** in `pdf.controller.ts` is a proper fix. The database uses Prisma's `@default(cuid())` for all 15+ models, so rejecting CUIDs was a guaranteed 400 error on every PDF request.

3. **Compact chart mode** is well-structured -- the `ChartRenderOptions` interface, optional parameter, and conditional styling cleanly separate share-card rendering from standalone chart rendering without code duplication.

4. **Layout adjustments** in card.service.ts (smaller margins, font sizes, repositioned elements) are reasonable incremental tweaks to accommodate the larger CHART_SIZE of 540px.

5. **SendPulse documentation** is thorough, user-friendly, written in Russian for the customer, and includes practical security advice about API key handling.

---

## Issues Found

### CRITICAL

#### C1. Chart.js memory leak -- Chart instances are never destroyed

**File**: `apps/api/src/modules/results/chart.service.ts:156`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
new Chart(ctx as any, config);

return canvas.toBuffer("image/png");
```

The Chart.js instance is created, renders synchronously to the canvas, but is never destroyed. According to Chart.js documentation:

> "The .destroy() method is essential for cleaning up chart instances. It removes all references stored within Chart.js and detaches any associated event listeners. It is critical to call this method before reusing a canvas element for a new chart to prevent memory leaks."

Every call to `generateRadarChart()` creates an orphaned Chart instance. In a long-running NestJS server processing many test completions, this will cause unbounded memory growth.

**Fix**:

```typescript
const chart = new Chart(ctx as any, config);
const buffer = canvas.toBuffer("image/png");
chart.destroy();
return buffer;
```

---

### IMPORTANT

#### I1. Font family name conflict between CardService and ChartService

**Files**:
- `apps/api/src/modules/results/card.service.ts:42-44` -- registers `Inter-Regular.ttf` as family `"Inter"`
- `apps/api/src/modules/results/chart.service.ts:45` -- registers `Inter-Bold.ttf` as family `"Inter"`

Both services register different font files under the same family name `"Inter"` via `GlobalFonts.registerFromPath()`. `GlobalFonts` is process-global, so the last service to initialize wins.

In `results.module.ts`, providers are ordered `[ResultsService, ChartService, CardService]`. NestJS initializes in dependency order, so ChartService.onModuleInit() runs first (registers Inter-Bold as "Inter"), then CardService.onModuleInit() overwrites it (registers Inter-Regular as "Inter").

**Impact**: The chart's `pointLabels` are configured with `family: "Inter, sans-serif"` and `weight: "bold"`. After CardService overwrites, "Inter" points to Inter-Regular. Whether bold rendering still works depends on `@napi-rs/canvas` font weight matching behavior, which is not guaranteed.

**Fix**: Use consistent family naming. ChartService should register as `"Inter Bold"` (same as CardService does) and reference that in the chart config, or better yet, extract font registration into a shared service:

```typescript
// Option A: Fix the family name in ChartService
GlobalFonts.registerFromPath(join(fontsDir, "Inter-Bold.ttf"), "Inter Bold");
// And in the chart config:
font: { family: "Inter Bold, Inter, sans-serif", ... }

// Option B (preferred): Create a shared FontService
@Injectable()
export class FontService implements OnModuleInit {
  private registered = false;
  onModuleInit() { this.register(); }
  register() {
    if (this.registered) return;
    // Register all fonts once, consistently
    this.registered = true;
  }
}
```

---

#### I2. Score rescaling produces misleading chart for equal-score profiles

**File**: `apps/api/src/modules/results/chart.service.ts:79-84`

```typescript
const range = maxVal - minVal || 1;
chartData = rawData.map((v) => ((v - minVal) / range) * 65 + 25);
```

When all RIASEC scores are equal (e.g., `[50, 50, 50, 50, 50, 50]`):
- `range = 0`, falls back to `1`
- All values: `((50-50)/1) * 65 + 25 = 25`
- Result: a tiny hexagon at 25% of the chart radius

This is visually misleading. A student with perfectly balanced scores at 50% should see a large, balanced hexagon, not a tiny dot. The `|| 1` fallback handles the division-by-zero but produces semantically wrong output.

Additionally, small differences are dramatically exaggerated. Input `[49, 50, 50, 50, 50, 51]` (2-point spread) maps to `[25, 57.5, 57.5, 57.5, 57.5, 90]`, making a near-uniform profile look extremely unbalanced.

**Fix**:

```typescript
if (compact) {
  const maxVal = Math.max(...rawData);
  const minVal = Math.min(...rawData);
  const range = maxVal - minVal;

  if (range < 5) {
    // Near-equal scores: show them at their actual magnitude
    // Scale so that max score maps to ~85% of chart
    const scale = maxVal > 0 ? 85 / maxVal : 1;
    chartData = rawData.map((v) => Math.max(v * scale, 10));
  } else {
    // Normal case: rescale to fill [25, 90] range
    chartData = rawData.map((v) => ((v - minVal) / range) * 65 + 25);
  }
  chartMax = 100;
}
```

---

#### I3. Session ID validation is missing in ResultsController

**File**: `apps/api/src/modules/results/results.controller.ts`

The `PdfController` validates `sessionId` format before querying the database (line 41-44), but `ResultsController` accepts any string as `sessionId` across 6 endpoints:
- `GET :sessionId` (line 82)
- `GET :sessionId/careers` (line 91)
- `GET :sessionId/radar-chart` (line 100)
- `GET :sessionId/summary` (line 124)
- `GET :sessionId/share-card` (line 142)
- `POST :sessionId/email-report` (line 178)

While Prisma will safely reject invalid IDs, unvalidated input reaching the ORM means unnecessary database round-trips and potential for error message information leakage.

**Fix**: Extract the validation regex into a shared Pipe or Guard and apply it consistently:

```typescript
// shared/pipes/session-id.pipe.ts
@Injectable()
export class ParseSessionIdPipe implements PipeTransform {
  private readonly regex = /^[a-z0-9]{20,30}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  transform(value: string) {
    if (!this.regex.test(value)) {
      throw new BadRequestException('Invalid session ID format');
    }
    return value;
  }
}

// Usage:
@Get(':sessionId')
async getResults(@Param('sessionId', ParseSessionIdPipe) sessionId: string) { ... }
```

---

### SUGGESTIONS

#### S1. Stale comment on rescaling range

**File**: `apps/api/src/modules/results/chart.service.ts:75`

```typescript
// Map scores to [20, 95] range preserving relative differences
```

The code maps to `[25, 90]` (formula: `* 65 + 25` yields `25` minimum, `25 + 65 = 90` maximum). The comment says `[20, 95]` -- a leftover from a previous iteration.

**Fix**: Update comment to `// Map scores to [25, 90] range preserving relative differences`.

---

#### S2. Dynamic import of `loadImage` inside method

**File**: `apps/api/src/modules/results/card.service.ts:229`

```typescript
const { loadImage } = await import("@napi-rs/canvas");
```

`loadImage` is dynamically imported inside `generateShareCard()` on every call, even though `@napi-rs/canvas` is already statically imported at line 2. This adds unnecessary overhead.

**Fix**: Add `loadImage` to the static import at the top of the file:

```typescript
import { createCanvas, GlobalFonts, SKRSContext2D, loadImage } from "@napi-rs/canvas";
```

---

#### S3. CUID regex is overly permissive due to `i` flag

**File**: `apps/api/src/modules/pdf/pdf.controller.ts:42`

```typescript
const sessionIdRegex =
  /^[a-z0-9]{20,30}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

The `i` flag makes both alternations case-insensitive. CUIDs generated by Prisma are always lowercase (`[a-z0-9]`). With the `i` flag, uppercase strings like `AABBCCDD11223344556677` also pass validation. This is not a security risk (Prisma will simply not find the record), but it is imprecise.

**Fix**: Apply the `i` flag only to the UUID alternation, or accept it as-is since it has no practical impact:

```typescript
const sessionIdRegex =
  /^[a-z0-9]{20,30}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Acceptable as-is. Overly permissive on CUID part but harmless.
```

---

## Plan Alignment Assessment

Comparing against the plan at `docs/plans/fluttering-cooking-sundae.md`:

| Planned Change | Status | Notes |
|----------------|--------|-------|
| Fix CUID validation in pdf.controller.ts | Done | Implemented as specified |
| Create Beads task for SendPulse credentials | Done | `skilltree-3.md` created with clear steps |
| Create SendPulse setup instructions | Done | Thorough and user-friendly |
| No changes to pdf.service.ts | Correct | Not modified |
| No changes to email.service.ts | Correct | Not modified |

The plan did not cover the chart.service.ts and card.service.ts changes (font path fix, compact mode, rescaling, font registration). These were addressed in separate commits predating the plan. All plan items were implemented correctly.

---

## Security Assessment

| Check | Status | Notes |
|-------|--------|-------|
| Session ID injection | Partial | PdfController validates; ResultsController does not (see I3) |
| CUID regex strength | OK | Sufficiently restrictive for the use case |
| Filename sanitization | OK | `pdf.controller.ts:88` properly sanitizes with `replace(/[^a-zA-Z0-9-]/g, "")` |
| Response headers | OK | `X-Content-Type-Options: nosniff` present |
| API key handling docs | OK | Instruction correctly warns against public sharing |
| No secrets in code | OK | SendPulse credentials are env vars, not hardcoded |

---

## Performance Assessment

| Concern | Severity | Notes |
|---------|----------|-------|
| Chart.js memory leak (C1) | High | Unbounded growth in long-running process |
| Dynamic `loadImage` import (S2) | Low | Minor overhead per call, V8 module cache mitigates |
| Font registration idempotency | OK | `fontsRegistered` flag prevents redundant FS operations |
| Canvas allocation per request | OK | Expected for server-side image generation |

---

## Recommended Action Priority

1. **C1** -- Chart.js `.destroy()` call (memory leak): Fix immediately before next deploy
2. **I1** -- Font family name conflict: Fix in next feature cycle
3. **I2** -- Equal-score rescaling: Fix before user-facing launch
4. **I3** -- Session ID validation in ResultsController: Fix in next feature cycle
5. **S1-S3** -- Minor improvements: Batch with other cleanup work

---

## Files Referenced

| File | Lines of Interest |
|------|-------------------|
| `apps/api/src/modules/results/chart.service.ts` | 45, 75, 79-84, 156 |
| `apps/api/src/modules/results/card.service.ts` | 2, 39, 42-44, 229 |
| `apps/api/src/modules/pdf/pdf.controller.ts` | 41-44 |
| `apps/api/src/modules/results/results.controller.ts` | 82, 91, 100, 124, 142, 178 |
| `apps/api/src/modules/results/results.module.ts` | 11 (provider order) |
| `docs/instructions/sendpulse-setup.md` | Full file |
| `.beads/issues/skilltree-3.md` | Full file |
| `docs/plans/fluttering-cooking-sundae.md` | Full file (plan reference) |
