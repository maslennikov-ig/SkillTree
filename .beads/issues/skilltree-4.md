---
id: skilltree-4
title: "Add ParseSessionIdPipe for consistent session ID validation"
type: improvement
status: open
priority: 3
labels: [security, api, validation]
created: 2026-03-27T16:45:00Z
---

## Description

PdfController validates sessionId format (CUID or UUID) before DB queries, but ResultsController accepts any string across 6 endpoints. While Prisma safely rejects invalid IDs, unvalidated input causes unnecessary DB round-trips.

## Solution

Create a shared `ParseSessionIdPipe` and apply to both controllers.

```typescript
// apps/api/src/common/pipes/parse-session-id.pipe.ts
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
```

Apply to all `@Param('sessionId')` in:
- `apps/api/src/modules/results/results.controller.ts` (6 endpoints)
- `apps/api/src/modules/pdf/pdf.controller.ts` (replace inline regex)

## Source

Found during code review: `docs/reports/code-review/2026-03-27-share-card-fixes.md` (I3)
