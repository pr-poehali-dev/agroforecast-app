-- Обновляем срок действия демо-объявлений на 24 часа от сейчас,
-- а также деактивируем все уже истёкшие
UPDATE board_listings
SET expires_at = NOW() + INTERVAL '24 hours'
WHERE source != 'user' AND is_active = TRUE;
