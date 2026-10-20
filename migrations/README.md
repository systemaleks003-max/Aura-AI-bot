# Миграции базы данных

## Как применить миграцию

### Локально (если используется локальная БД):
```bash
psql -d <database_name> -f migrations/add_voice_crystals.sql
```

### В Docker:
```bash
docker exec -i <postgres_container> psql -U <username> -d <database_name> < migrations/add_voice_crystals.sql
```

### Через pgAdmin или DBeaver:
1. Открой соединение с БД
2. Открой файл `add_voice_crystals.sql`
3. Выполни SQL-скрипт

### Через переменную окружения DATABASE_URL:
```bash
psql "$DATABASE_URL" -f migrations/add_voice_crystals.sql
```

## История миграций

- **add_voice_crystals.sql** (2026-10-20): Добавление системы голосовых сообщений и кристаллов
  - Колонка `voice_free_count` (INTEGER, DEFAULT 0)
  - Колонка `crystals` (INTEGER, DEFAULT 0)
