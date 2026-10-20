#!/usr/bin/env python3
"""
Скрипт для генерации голосовых сообщений через edge-tts (локальный TTS).
Читает текст из stdin и сохраняет MP3 в указанный файл.
"""
import sys
import asyncio
import edge_tts

async def main():
    # Читаем текст из stdin (чтобы избежать проблем с кавычками)
    text = sys.stdin.read().strip()

    if not text:
        print("[TTS ERROR] Пустой текст для генерации голоса", file=sys.stderr)
        sys.exit(1)

    # Голос ru-RU-DariyaNeural (женский, эмоциональный, подходит для флирта)
    voice = "ru-RU-DariyaNeural"

    # Путь к выходному файлу (передается как аргумент или дефолт)
    output_file = sys.argv[1] if len(sys.argv) > 1 else "temp_voice.mp3"

    print(f"[TTS] Генерируем голос: {len(text)} символов → {output_file}", file=sys.stderr)

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        print(f"[TTS] ✅ Аудиофайл сохранен: {output_file}", file=sys.stderr)
    except Exception as e:
        print(f"[TTS ERROR] Ошибка генерации: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
