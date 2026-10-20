import fs from 'fs';
import path from 'path';

/**
 * Генерация голосового сообщения через OpenRouter (ElevenLabs)
 * @param {string} text - Текст для озвучки
 * @returns {Promise<string>} Путь к файлу temp_voice.mp3
 */
export async function generateVoice(text) {
    const outputPath = path.join(process.cwd(), 'temp_voice.mp3');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'elevenlabs/eleven-turbo-v2', // Быстрая модель ElevenLabs
                input: text,
                voice: 'Rachel' // Женский голос (мягкий, игривый)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[TTS ERROR] OpenRouter вернул статус ${response.status}:`, errorText);
            throw new Error(`TTS API error: ${response.status} - ${errorText}`);
        }

        // Получаем бинарные данные аудио
        const audioBuffer = await response.arrayBuffer();

        // Записываем в файл
        fs.writeFileSync(outputPath, Buffer.from(audioBuffer));

        console.log(`[TTS SUCCESS] Голосовое сообщение записано в ${outputPath}`);
        return outputPath;

    } catch (error) {
        console.error('[TTS ERROR] Не удалось сгенерировать голос через OpenRouter:', error.message);
        throw error;
    }
}
