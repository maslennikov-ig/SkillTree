# Plan: Fix RIASEC Radar Chart Visibility on Share Card in Telegram

## Context

Share card (1080x1080) с радарной диаграммой RIASEC-профиля плохо читается в Telegram:
- Подписи осей (~4px после сжатия) — невидимы
- Сетка (opacity 0.1) — исчезает после сжатия
- При низких баллах полигон сжимается в точку в центре
- Цифры тиков (14px) — нечитаемый шум

**Цепочка масштабирования**: 600px chart → 400px на карточке → ~375px карточка в Telegram → **~139px итоговый размер диаграммы**

## Approach: Compact Mode for Share Card

Добавить режим `compact` в ChartService — увеличенные шрифты, жирные линии, скрытые тики, минимальные баллы. CardService передаёт `{ compact: true }` и увеличивает область диаграммы.

## Changes

### 1. `apps/api/src/modules/results/chart.service.ts`

**Добавить интерфейс опций и изменить сигнатуру:**
```typescript
interface ChartRenderOptions {
  compact?: boolean;  // Bold rendering for small display
}
```
`generateRadarChart(scores, options?: ChartRenderOptions)`

**Логика compact mode:**
- Canvas: 800x800 (вместо 600x600) — больше пикселей для выживания при сжатии
- Min score clamping: `Math.max(score, 15)` — полигон всегда видимый, не точка
- Подписи осей: **36px bold** (вместо 16px) → ~8.4px в Telegram — читаемо
- Сетка: `rgba(0,0,0,0.18)`, lineWidth 2 (вместо 0.1/1px)
- Angle lines: `rgba(0,0,0,0.15)`, lineWidth 1.5
- Border width: 5 (вместо 3) → ~1.2px в Telegram
- Point radius: 10 (вместо 6) → ~2.3px в Telegram
- Тики (20, 40, 60, 80): **скрыть** — при 3px нечитаемы, только шум
- Цвет подписей: `#1a1a1a` (вместо #333)

**Default mode** (без опций) — не меняется. Controller и PDF продолжают работать как раньше.

### 2. `apps/api/src/modules/results/card.service.ts`

**Увеличить область диаграммы:**
- `CHART_SIZE`: 400 → **540** (50% ширины карточки вместо 37%)

**Передать compact mode:**
```typescript
this.chartService.generateRadarChart(data.scores, { compact: true })
```

**Сжать layout вертикально** чтобы вместить бОльшую диаграмму:
- `cardMargin`: 60 → 50
- Emoji: 64px → 56px
- Archetype name: 42px → 38px
- Holland badge: на 15px выше
- Chart Y: на 20px выше
- Career/branding: шрифты чуть мельче (18→16, 28→26, 24→22, 16→14)

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/results/chart.service.ts` | Add `ChartRenderOptions`, compact mode logic |
| `apps/api/src/modules/results/card.service.ts` | CHART_SIZE 540, pass compact, compress layout |

## Files NOT Modified (backward compatibility)

- `apps/api/src/modules/results/results.controller.ts` — standalone endpoint, default mode
- `apps/api/src/modules/pdf/pdf.service.ts` — PDF report, default mode
- `apps/bot/src/handlers/results.handler.ts` — calls API, no chart logic

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Chart area in Telegram | ~139px | ~188px |
| Label size in Telegram | ~3.7px (invisible) | ~8.4px (readable) |
| Grid visibility | invisible | faint but visible |
| Polygon border | ~0.7px (sub-pixel) | ~1.2px (visible) |
| Low scores | collapsed dot | visible hexagon (min 15%) |

## Verification

1. `cd apps/api && pnpm build` — TypeScript компиляция
2. Запустить API локально, вызвать `GET /results/:sessionId/share-card`
3. Открыть PNG, убедиться что подписи и полигон видны
4. Отправить в Telegram бот, проверить читаемость в чате
