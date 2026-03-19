---
id: skilltree-2
title: "Update CardService layout for larger chart on share card"
type: fix
status: closed
priority: 1
labels: [chart, telegram]
created: 2026-03-19T09:30:00Z
closed: 2026-03-19T09:45:00Z
---

## Description

Share card embedded the radar chart at 400x400px within a 1080x1080 card — only 37% of card width. After Telegram compression, the chart area was ~139px — too small to read labels or see polygon shape.

## Solution

Updated `card.service.ts` to allocate more space for the chart and compress surrounding elements:
- `CHART_SIZE`: 400 → **540** (50% of card width, ~188px effective in Telegram)
- Pass `{ compact: true }` to `chartService.generateRadarChart()`
- Compressed vertical layout to fit larger chart:
  - `cardMargin`: 60 → 50
  - Emoji: 64px → 56px
  - Archetype name: 42px → 38px
  - Holland badge: shifted up 15px, height 40 → 36
  - Chart Y: shifted up 20px
  - Career/branding fonts: slightly smaller (18→16, 28→26, 24→22, 16→14)

## Files Modified

- `apps/api/src/modules/results/card.service.ts`
