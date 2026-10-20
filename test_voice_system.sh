#!/bin/bash
# Тестовый скрипт для проверки системы голосовых и кристаллов

echo "=== ТЕСТ СИСТЕМЫ ГОЛОСОВЫХ И КРИСТАЛЛОВ ==="
echo ""

# Проверка синтаксиса всех измененных файлов
echo "1. Проверка синтаксиса..."
node --check src/database.js && echo "✅ database.js"
node --check src/queue.js && echo "✅ queue.js"
node --check src/handlers/profile.js && echo "✅ profile.js"
node --check src/bot.js && echo "✅ bot.js"
node --check src/services/tts.js && echo "✅ tts.js"

echo ""
echo "2. Проверка переменных окружения..."
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  OPENROUTER_API_KEY не установлен"
else
    echo "✅ OPENROUTER_API_KEY установлен"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL не установлен"
else
    echo "✅ DATABASE_URL установлен"
fi

echo ""
echo "3. Проверка структуры базы данных..."
if [ ! -z "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "\d users" | grep -E "voice_free_count|crystals"
    if [ $? -eq 0 ]; then
        echo "✅ Колонки voice_free_count и crystals найдены"
    else
        echo "❌ Колонки не найдены! Примени миграцию: psql \"\$DATABASE_URL\" -f migrations/add_voice_crystals.sql"
    fi
else
    echo "⚠️  DATABASE_URL не задан, пропускаем проверку БД"
fi

echo ""
echo "=== ТЕСТ ЗАВЕРШЕН ==="
