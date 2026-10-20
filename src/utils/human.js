export const delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Удаляет все Markdown-символы из текста
 */
export function stripMarkdown(text) {
  return text.replace(/[*_`\[\]~|>]/g, '');
}

export async function humanReply(ctx, text) {
  // Имитируем прочтение
  await delay(Math.random() * 1000 + 500);

  await ctx.sendChatAction('typing');

  // Разбиваем на части по предложениям
  const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];

  for (const chunk of chunks) {
    const typingTime = Math.min(chunk.length * 40, 4000); // 40мс на символ, макс 4с
    await delay(typingTime);
    await ctx.reply(chunk.trim());

    if (chunks.length > 1) {
      await ctx.sendChatAction('typing');
      await delay(800);
    }
  }
}
