// Сервис для работы с ZhipuAI (glm-5.3-flash)
// Модель отлично справляется с NSFW и не отдает пустые ответы

import OpenAI from 'openai';

const zhipuClient = new OpenAI({
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.ZHIPU_API_KEY,
});

/**
 * Генерация текста через ZhipuAI glm-5.3-flash
 * @param {Array} messages - История сообщений [{role: 'system'|'user'|'assistant', content: string}]
 * @param {string} userId - ID пользователя (для логирования)
 * @returns {Promise<{text: string, photo: string|null, isVoiceRequest: boolean}>}
 */
export async function chat(messages, userId) {
    try {
        console.log(`[VIBECODE] Запрос к glm-5.3-flash для юзера ${userId}, сообщений: ${messages.length}`);

        const completion = await zhipuClient.chat.completions.create({
            model: 'glm-5.3-flash',
            messages: messages,
            temperature: 0.9,
            max_tokens: 800,
            top_p: 0.85,
        });

        console.log(`[VIBECODE] Ответ получен, choices: ${completion.choices?.length || 0}`);

        const content = completion.choices?.[0]?.message?.content;

        if (!content || content.trim().length === 0) {
            console.error(`[VIBECODE ERROR] Пустой ответ от glm-5.3-flash для юзера ${userId}`);
            console.error(`[VIBECODE ERROR] Полный ответ:`, JSON.stringify(completion, null, 2));

            // Фоллбэк: возвращаем заглушку в стиле персонажа
            return {
                text: "Прости, я немного задумалась... 😳 О чём ты говорил?",
                photo: null,
                isVoiceRequest: false
            };
        }

        const text = content.trim();
        console.log(`[VIBECODE] Текст получен, длина: ${text.length}`);

        // Проверяем, запрашивал ли пользователь голосовой ответ
        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
        const isVoiceRequest = /голос|аудио|скажи вслух|прочитай/i.test(lastUserMsg);

        console.log(`[VIBECODE] isVoiceRequest: ${isVoiceRequest}`);

        return {
            text: text,
            photo: null,
            isVoiceRequest: isVoiceRequest
        };

    } catch (error) {
        console.error(`[VIBECODE ERROR] Ошибка запроса к glm-5.3-flash:`, error.message);
        if (error.response) {
            console.error(`[VIBECODE ERROR] Response data:`, JSON.stringify(error.response.data, null, 2));
        }

        // Фоллбэк при ошибке API
        return {
            text: "❌ Извини, что-то пошло не так... Попробуй ещё раз через минуту? 🥺",
            photo: null,
            isVoiceRequest: false
        };
    }
}
