# Система голосовых сообщений и кристаллов

## Обзор

Бот теперь поддерживает **голосовые сообщения** от ИИ-персонажа. Пользователи могут:
- Получить **3 бесплатных голосовых** при регистрации
- Купить **кристаллы** через Telegram Stars для дополнительных голосовых

## Как это работает

### 1. Лимиты и баланс
- Новый пользователь: `voice_free_count = 0` (доступно 3 бесплатных)
- Каждое голосовое: `voice_free_count++` (пока не достигнет 3)
- После 3 бесплатных: `-1 кристалл` за каждое голосовое

### 2. Логика проверки (`checkAndDeductVoiceLimit`)
```javascript
if (voice_free_count < 3) {
  // Используем бесплатное голосовое
  voice_free_count++
  return { canUse: true, isFree: true, remaining: 3 - voice_free_count }
} else if (crystals > 0) {
  // Списываем 1 кристалл
  crystals--
  return { canUse: true, isFree: false, crystalsLeft: crystals }
} else {
  // Нет ни бесплатных, ни кристаллов
  return { canUse: false, message: '...' }
}
```

### 3. Генерация голоса
- Если `response.voice === true` (установлено в промпте или случайно)
- Проверяем лимит через `checkAndDeductVoiceLimit(userId)`
- Если `canUse === false` → отправляем текст + сообщение о покупке кристаллов
- Если `canUse === true` → генерируем голос через OpenRouter TTS

## Покупка кристаллов

### Цены (Telegram Stars)
- **10 кристаллов = 50 Stars** (~$0.50 USD)

### Процесс оплаты
1. Пользователь нажимает "💎 Купить 10 кристаллов" в профиле
2. `ctx.replyWithInvoice(...)` отправляет инвойс
3. Пользователь оплачивает через Telegram Stars
4. `bot.on('pre_checkout_query')` → подтверждение
5. `bot.on('successful_payment')` → начисление кристаллов

### Код инвойса
```javascript
ctx.replyWithInvoice({
  title: 'Покупка кристаллов',
  description: '10 кристаллов для голосовых сообщений',
  payload: 'buy_10_crystals',
  provider_token: '', // Пусто для Stars
  currency: 'XTR',    // Код валюты Stars
  prices: [{ label: '10 кристаллов', amount: 50 }]
})
```

## База данных

### Новые колонки в `users`
```sql
ALTER TABLE users
ADD COLUMN voice_free_count INTEGER DEFAULT 0,
ADD COLUMN crystals INTEGER DEFAULT 0;
```

### Функции
- `checkAndDeductVoiceLimit(userId)` — проверка и списание лимита
- `addCrystals(userId, amount)` — начисление кристаллов после оплаты
- `getUserProfile(userId)` — получение профиля (для команды `/profile`)

## Команды

### `/profile`
Показывает:
- 🎙 Бесплатных голосовых осталось: `3 - voice_free_count`
- 💎 Баланс кристаллов: `crystals`
- Inline-кнопка "💎 Купить 10 кристаллов"

## Тестирование

### 1. Проверка синтаксиса
```bash
bash test_voice_system.sh
```

### 2. Применение миграции
```bash
psql "$DATABASE_URL" -f migrations/add_voice_crystals.sql
```

### 3. Ручной тест
1. Запусти бота: `npm start`
2. Отправь `/profile` — проверь отображение лимитов
3. Отправь сообщение, на которое ИИ ответит голосом (например, "расскажи стих голосом")
4. Проверь, что `voice_free_count` увеличился
5. Исчерпай 3 бесплатных голосовых
6. Купи 10 кристаллов через кнопку в профиле
7. Проверь, что кристаллы начислены

## Мониторинг

### Логи
- `[TTS]` — генерация голоса
- `[VOICE LIMIT]` — проверка лимита
- `[PAYMENT]` — покупка кристаллов

### Метрики
```sql
-- Средний баланс кристаллов
SELECT AVG(crystals) FROM users;

-- Пользователи, исчерпавшие бесплатные голосовые
SELECT COUNT(*) FROM users WHERE voice_free_count >= 3;

-- Общее количество купленных кристаллов
SELECT SUM(crystals) FROM users;
```

## Troubleshooting

### Ошибка: "Голосовые сообщения временно недоступны"
- Проверь `OPENROUTER_API_KEY` в `.env`
- Проверь модель `meta-llama/llama-3.2-3b-instruct:free` на OpenRouter

### Ошибка: "Не удалось обработать платеж"
- Telegram Stars доступны только в Production (не работает в локальной среде без реального бота)
- Проверь, что бот подключен к Telegram Payments

### Кристаллы не начисляются
- Проверь логи: `[PAYMENT] successful_payment`
- Проверь `payload` в `successful_payment.invoice_payload` (должен быть `'buy_10_crystals'`)

## Roadmap

- [ ] Добавить пакеты кристаллов (50, 100, 200)
- [ ] Реферальная система (бонус кристаллов за приглашение)
- [ ] Статистика использования голосовых в админке
- [ ] A/B тест цен на кристаллы
