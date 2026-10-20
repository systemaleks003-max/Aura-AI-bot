import { generateVoice } from './src/services/tts.js';
import fs from 'fs';

(async () => {
    console.log('🧪 ТЕСТ: Генерация голосового сообщения через edge-tts (Python)\n');

    const testText = 'Привет, малыш! Скучала по тебе. Как дела?';
    console.log(`📝 Текст для озвучивания: "${testText}"`);
    console.log(`📏 Длина текста: ${testText.length} символов\n`);

    console.log('⏳ Генерируем аудио...\n');

    const voiceFile = await generateVoice(testText);

    if (voiceFile && fs.existsSync(voiceFile)) {
        const stats = fs.statSync(voiceFile);
        console.log(`\n✅ УСПЕХ! Аудиофайл создан:`);
        console.log(`   📂 Путь: ${voiceFile}`);
        console.log(`   📦 Размер: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`\n🎧 Файл можно открыть в любом аудиоплеере.`);
        console.log(`\n🧹 Удаляем тестовый файл...`);
        fs.unlinkSync(voiceFile);
        console.log(`✅ Файл удалён.`);
    } else {
        console.log(`\n❌ ОШИБКА: Не удалось создать аудиофайл.`);
        console.log(`   Проверьте логи выше [TTS ERROR].`);
        process.exit(1);
    }

    console.log(`\n🎉 Тест завершён успешно! edge-tts (Python) работает корректно.`);
})();
