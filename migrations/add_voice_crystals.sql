-- Миграция: Добавление системы голосовых сообщений и кристаллов
-- Дата: 2026-10-20

-- Добавляем колонки voice_free_count и crystals в таблицу users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS voice_free_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS crystals INTEGER DEFAULT 0;

-- Комментарии для документации
COMMENT ON COLUMN users.voice_free_count IS 'Счетчик использованных бесплатных голосовых сообщений (макс. 3)';
COMMENT ON COLUMN users.crystals IS 'Баланс кристаллов для оплаты голосовых сообщений';
