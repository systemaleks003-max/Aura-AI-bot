import { Queue, Worker } from 'bullmq';
import { generateResponse } from './ai.js';
import { resetSilenceTimer } from './silence.js';
import { decrementFreeRequest, checkVoiceLimit, deductVoiceLimit } from './database.js';
import fs from 'fs';
import { generateVoice } from './services/tts.js';
import { humanReply, stripMarkdown } from './utils/human.js';

// Парсим URL из .env и жестко задаем IPv4 (family: 4)
const redisUrl = new URL(process.env.REDIS_URL);
const connection = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port, 10) || 6379,
    family: 4 // Спасает от ошибки EAI_AGAIN в Docker
};

export const aiQueue = new Queue('ai-requests', { connection });

/**
 * Безопасная отправка текста с fallback на plain text при ошибке парсинга Markdown
 */
async function safeHumanReply(bot, chatId, text, extraOptions) {
    try {
        await humanReply({
            reply: (text) => bot.telegram.sendMessage(chatId, text, extraOptions),
            sendChatAction: (action) => bot.telegram.sendChatAction(chatId, action)
        }, text);
    } catch (error) {
        // Если Telegram не может распарсить Markdown (незакрытые теги)
        if (error.description?.includes("can't parse entities") || error.message?.includes("can't parse entities")) {
            console.warn('[MARKDOWN ERROR] Незакрытые теги, отправляю без форматирования:', error.message);

            // Убираем Markdown и отправляем как plain text
            const cleanText = stripMarkdown(text);

            // Создаём новые опции без parse_mode, но сохраняем reply_markup (кнопки)
            const plainOptions = { ...extraOptions };
            delete plainOptions.parse_mode;

            await humanReply({
                reply: (text) => bot.telegram.sendMessage(chatId, text, plainOptions),
                sendChatAction: (action) => bot.telegram.sendChatAction(chatId, action)
            }, cleanText);
        } else {
            // Другая ошибка — пробрасываем дальше
            throw error;
        }
    }
}

export function startWorker(bot) {
    new Worker('ai-requests', async job => {
        const { userId, text, chatId, shouldDecrement, tempMsgId } = job.data;
        // индикатор «печатает…»
    let typingTimer = null;
    const pulseTyping = async () => {
      try { await bot.telegram.sendChatAction(chatId, 'typing'); } catch (e) { console.error('Ошибка pulseTyping:', e.message); }
    };
    await pulseTyping();
    typingTimer = setInterval(pulseTyping, 4000);
    try {
      const response = await generateResponse(userId, text);
      if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
            
            if (shouldDecrement) {
                await decrementFreeRequest(userId);
            }
            
            // ЕСЛИ ЕСТЬ ФОТО - отправляем картинку и текст ОДНИМ сообщением (в виде подписи)
            if (response.photo) {
                try {
                    // Сначала удаляем временное сообщение "Печатаю ответ..."
                    if (tempMsgId) {
                        await bot.telegram.deleteMessage(chatId, tempMsgId).catch(() => {});
                    }
                    
                    // Защита от лимитов Telegram (максимальная длина подписи к фото - 1024 символа)
                    let captionText = response.text || "";
                    if (captionText.length > 1024) {
                        captionText = captionText.substring(0, 1020) + "...";
                    }
                    
                    // Отправляем фото с подписью
                    await bot.telegram.sendPhoto(chatId, response.photo, { 
                        caption: captionText, 
                        parse_mode: 'Markdown' 
                    });
                } catch (imgError) {
                    console.error(`[TELEGRAM ERROR] Не удалось отправить фото юзеру ${userId}:`, imgError.message);
                    const fallbackText = response.text + "\n\n❌ _Фото сгенерировано, но Telegram отказался его загружать._";
                    if (tempMsgId) {
                        await bot.telegram.editMessageText(chatId, tempMsgId, null, fallbackText, { parse_mode: 'Markdown' }).catch(() => {});
                    } else {
                        await bot.telegram.sendMessage(chatId, fallbackText, { parse_mode: 'Markdown' });
                    }
                }
            } else {
                // Если фото нет, проверяем, нужно ли отправить голос

                // Удаляем временное сообщение "Печатаю ответ..."
                if (tempMsgId) {
                    await bot.telegram.deleteMessage(chatId, tempMsgId).catch(() => {});
                }

                const extraOptions = { parse_mode: 'Markdown' };

                // Если нейросеть сказала, что лимит исчерпан — прикрепляем кнопку
                if (response.showBuyButton) {
                    extraOptions.reply_markup = {
                        inline_keyboard: [[{ text: '⭐️ Перейти в магазин', callback_data: 'trigger_buy' }]]
                    };
                }

                // Если пользователь явно попросил голосовое сообщение
                console.log('[VOICE DEBUG] Запрос голоса:', response.isVoiceRequest, 'Длина текста:', response.text.length);

                if (response.isVoiceRequest) {
                    // Сначала ТОЛЬКО проверяем лимит, НЕ списываем
                    const hasVoiceLimit = await checkVoiceLimit(userId);

                    // Очищаем текст от Markdown-символов для корректного подсчёта длины
                    const cleanTextForCheck = stripMarkdown(response.text);

                    console.log('[VOICE DEBUG] Лимит голоса:', hasVoiceLimit, 'Длина < 300:', cleanTextForCheck.length < 300, 'Чистая длина:', cleanTextForCheck.length);

                    if (hasVoiceLimit && cleanTextForCheck.length < 300) {
                        try {
                            console.log(`[VOICE DEBUG] Запускаю генерацию аудио для текста: "${response.text.substring(0, 100)}..."`);
                            console.log(`[VOICE] Генерация голосового для юзера ${userId}...`);
                            await bot.telegram.sendChatAction(chatId, 'record_voice');
                            const voiceFile = await generateVoice(response.text);
                            console.log('[VOICE DEBUG] Файл создан:', voiceFile);

                            if (voiceFile && fs.existsSync(voiceFile)) {
                                // ✅ Генерация успешна — ТЕПЕРЬ списываем лимит
                                await deductVoiceLimit(userId);

                                await bot.telegram.sendVoice(chatId, { source: voiceFile });
                                fs.unlinkSync(voiceFile); // Удаляем временный файл
                                console.log(`[VOICE] Успешно отправлено юзеру ${userId}`);
                                resetSilenceTimer(userId, bot, chatId);
                            } else {
                                // ❌ Голос не сгенерировался — НЕ списываем лимит
                                const fallbackText = response.text + "\n\n❌ _К сожалению, не удалось сгенерировать голосовое. Попробуй позже._";
                                await safeHumanReply(bot, chatId, fallbackText, extraOptions);
                                resetSilenceTimer(userId, bot, chatId);
                            }
                        } catch (voiceError) {
                            console.error('[VOICE ERROR]', voiceError.message);
                            // ❌ Ошибка генерации — НЕ списываем лимит
                            const fallbackText = response.text + "\n\n❌ _Произошла ошибка при генерации голоса._";
                            await safeHumanReply(bot, chatId, fallbackText, extraOptions);
                            resetSilenceTimer(userId, bot, chatId);
                        }
                    } else {
                        // Лимит закончился или текст слишком длинный
                        console.log('[VOICE DEBUG] Не генерируем голос. Причина: лимит =', hasVoiceLimit, ', длина < 300 =', cleanTextForCheck.length < 300);
                        let finalText = response.text;

                        if (!hasVoiceLimit) {
                            finalText += "\n\n🔊 _Лимит бесплатных голосовых исчерпан (3/день). Купи кристаллы в профиле, чтобы я продолжала с тобой говорить голосом_ 💎";
                        } else if (cleanTextForCheck.length >= 300) {
                            finalText += "\n\n⚠️ _Текст слишком длинный для голосового (макс. 300 символов)._";
                        }

                        await safeHumanReply(bot, chatId, finalText, extraOptions);
                        resetSilenceTimer(userId, bot, chatId);
                    }
                } else {
                    // Обычное текстовое сообщение без голоса
                    console.log('[VOICE DEBUG] isVoiceRequest = false. Отправляю обычный текст.');
                    await safeHumanReply(bot, chatId, response.text, extraOptions);
                    resetSilenceTimer(userId, bot, chatId);
                }
            }
        } catch (error) {
            if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
      console.error(`[ОШИБКА ИИ] Юзер ${userId}:`, error);
            const errorMsg = "❌ _Извините, произошла ошибка генерации ответа._";
            if (tempMsgId) {
                await bot.telegram.editMessageText(chatId, tempMsgId, null, errorMsg, { parse_mode: 'Markdown' }).catch(() => {});
            } else {
                await bot.telegram.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
            }
        }
    }, { 
        connection,
        concurrency: 5 
    });
}