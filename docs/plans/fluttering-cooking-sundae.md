# Plan: Fix editMessageText crash on photo messages in bot callbacks

## Context

Кнопка "Результаты" отправляет share card как **фото** с inline keyboard. Когда тестер нажимает кнопки ("Все профессии", "PDF Roadmap", "Отправить родителям"), обработчики вызывают `ctx.editMessageText()`. Telegram API возвращает 400: "there is no text in the message to edit" — потому что нельзя заменить фото-сообщение на текст через `editMessageText`.

До добавления share card (commit `ee45384`) результаты были текстовыми → `editMessageText` работал. После добавления фото → все 30 вызовов `editMessageText` в callback-обработчиках ломаются.

## Approach

Создать хелпер-функцию `safeEditOrReply(ctx, text, options)`:
1. Пробует `ctx.editMessageText(text, options)` 
2. Если ошибка "there is no text in the message to edit" → fallback на `ctx.reply(text, options)`
3. Другие ошибки — пробрасывает дальше

Заменить все 30 вызовов `ctx.editMessageText()` на `safeEditOrReply(ctx, ...)`.

## Changes

### `apps/bot/src/handlers/results.handler.ts`

**1. Добавить хелпер** (в секцию Fetch Utilities, после `fetchWithTimeout`):

```typescript
async function safeEditOrReply(
  ctx: MyContext,
  text: string,
  options?: Parameters<MyContext["editMessageText"]>[1],
): Promise<void> {
  try {
    await ctx.editMessageText(text, options);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("there is no text in the message to edit")
    ) {
      await ctx.reply(text, options as Parameters<MyContext["reply"]>[1]);
    } else {
      throw error;
    }
  }
}
```

**2. Replace** все 30 вызовов `ctx.editMessageText(...)` → `await safeEditOrReply(ctx, ...)`.

Список строк с `editMessageText`: 187, 196, 225, 231, 251, 278, 284, 307, 314, 321, 327, 356, 373, 425, 752, 771, 795, 805, 833, 844, 871, 897, 907, 932, 939, 946, 952, 1002, 1019, 1025.

## Files Modified

| File | Change |
|------|--------|
| `apps/bot/src/handlers/results.handler.ts` | Добавить `safeEditOrReply`, заменить 30 вызовов |

## Verification

1. `npx tsc --noEmit -p apps/bot/tsconfig.json` — типы
2. Deploy бота: push + pull + build + `pm2 restart skilltree-bot`
3. Тестер нажимает "Результаты" → получает фото-карточку
4. Нажимает "Все профессии" → видит список профессий (новое сообщение)
5. Нажимает "PDF Roadmap" → получает PDF-файл
6. Нажимает "Назад к результатам" → видит текстовые результаты
