import fs from 'fs';
import path from 'path';

/**
 * Генерация голосового сообщения через OpenRouter (ElevenLabs)
 * @param {string} text - Текст для озвучки
 * @param {string} voice - Голос (по умолчанию lily)
 * @returns {Promise<string>} Путь к файлу temp_voice.mp3
 */
export async function generateVoice(text, voice = 'lily') {
  const outputPath = path.join(process.cwd(), 'temp_voice.mp3');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'elevenlabs/eleven-multilingual-v2',
        input: text,
        voice: voice,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS ERROR] OpenRouter вернул статус ${response.status}:`, errorText);
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const jsonError = await response.text();
        console.error(`[TTS ERROR] OpenRouter вернул JSON вместо аудио:`, jsonError);
        throw new Error(`TTS API error: returned JSON`);
    }

    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));

    console.log(`[TTS SUCCESS] Голосовое сообщение записано в ${outputPath} (Голос: ${voice})`);
    return outputPath;
  } catch (error) {
    console.error('[TTS ERROR] Не удалось сгенерировать голос через OpenRouter:', error.message);
    throw error;
  }
}
