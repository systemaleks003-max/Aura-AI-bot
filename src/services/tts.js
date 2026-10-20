import { exec } from 'child_process';
import path from 'path';

export async function generateVoice(text) {
    return new Promise((resolve, reject) => {
        const child = exec('python3 src/services/tts.py', { timeout: 20000 }, (error) => {
            if (error) {
                console.error("Ошибка Python TTS:", error);
                return reject(error);
            }
            resolve(path.join(process.cwd(), 'temp_voice.mp3'));
        });
        // Передаем текст в stdin Python-скрипта
        child.stdin.write(text);
        child.stdin.end();
    });
}


