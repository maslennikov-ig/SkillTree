---
id: skilltree-1
title: "Add compact mode to ChartService for Telegram visibility"
type: fix
status: closed
priority: 1
labels: [chart, telegram]
created: 2026-03-19T09:30:00Z
closed: 2026-03-19T09:45:00Z
---

## Description

Radar chart on share card was unreadable in Telegram due to scaling chain: 600px canvas → 400px on card → ~375px card in Telegram → **~139px effective chart size**. Labels (~4px), grid (opacity 0.1), and low-score polygons were invisible.

## Solution

Added `ChartRenderOptions` interface with `compact` flag to `chart.service.ts`:
- Canvas: 600 → **800px** (more pixels survive compression)
- Labels: 16px → **36px bold** (~8.4px effective in Telegram — readable)
- Grid: `rgba(0,0,0,0.1)` → **`rgba(0,0,0,0.18)`, lineWidth 2**
- Angle lines: opacity 0.15, lineWidth 1.5
- Border width: 3 → **5** (~1.2px effective)
- Point radius: 6 → **10** (~2.3px effective)
- Ticks: **hidden** (unreadable noise at final size)
- Min score clamping: **15** (polygon always visible, not a dot)
- Default mode unchanged — backward compatible

## Files Modified

- `apps/api/src/modules/results/chart.service.ts`
