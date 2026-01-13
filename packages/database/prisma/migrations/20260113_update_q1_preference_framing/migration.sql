-- Update Q1 text from behavioral to preference framing
-- "Чем займёшься?" → "Какое занятие тебе по душе?"
-- This makes the question feel more authentic (asking about preferences, not predicting behavior)

UPDATE "Question"
SET text = '🎮 Выходной! Какое занятие тебе по душе?'
WHERE id = 'q1'
  AND text LIKE '%Чем займёшься%';
