-- Fix duplicate-like wording between q14 and q35 in production data.
-- q35 should measure precision/detail focus, not data tables interest.
UPDATE "Question"
SET
  "text" = '🔍 Насколько тебе важна точность и внимание к деталям в работе?',
  "ratingRange" = '{"min":1,"max":5,"labels":{"min":"1 = Не парюсь об этом 🤷","max":"5 = Каждая мелочь важна! 🎯"}}'::jsonb,
  "updatedAt" = NOW()
WHERE "id" = 'q35';
