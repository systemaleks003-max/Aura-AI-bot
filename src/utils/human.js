export const delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Удаляет все Markdown-символы из текста
 */
export function stripMarkdown(text) {
  return text.replace(/[*_`\[\]~|>]/g, '');
}

/**
 * Разбивает длинный текст на части по абзацам, не превышая лимит Telegram (4096 символов)
 */
function splitByParagraphs(text, maxLength = 4096) {
  // Если текст влезает в один месседж — возвращаем как есть
  if (text.length <= maxLength) {
    return [text];
  }

  // Разбиваем по двойным переносам строк (абзацы)
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // Если один абзац превышает лимит — режем его по предложениям
    if (paragraph.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
    } else {
      // Пробуем добавить абзац к текущему чанку
      if ((currentChunk + '\n\n' + paragraph).length > maxLength) {
        // Не влезает — сохраняем текущий чанк и начинаем новый
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph;
      } else {
        // Влезает — добавляем через двойной перенос
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // Ограничиваем до 3 сообщений максимум
  if (chunks.length > 3) {
    return chunks.slice(0, 3);
  }

  return chunks;
}

export async function humanReply(ctx, text) {
  // Имитируем прочтение (короткая пауза перед началом печати)
  await delay(Math.random() * 500 + 300);

  // Разбиваем текст на части, если он превышает лимит Telegram
  const chunks = splitByParagraphs(text);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Показываем индикатор печати перед каждым сообщением
    await ctx.sendChatAction('typing');

    // Рассчитываем время печати: ~30мс на символ, но не более 3 секунд
    const typingTime = Math.min(chunk.length * 30, 3000);
    await delay(typingTime);

    // Отправляем сообщение целиком
    await ctx.reply(chunk);

    // Если есть ещё сообщения, делаем паузу перед следующим
    if (i < chunks.length - 1) {
      await delay(1000); // Пауза 1 секунда между сообщениями
    }
  }
}
