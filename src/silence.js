const SILENCE_MS = 3 * 60 * 1000; // 3 минуты
const MAX_PER_SESSION = 10;

const sessions = new Map(); // userId -> { timer, count }

const FOLLOW_UPS = [
  "Эй… я всё ещё здесь. Ты куда пропал? 🔥",
  "Молчишь — а я уже представила, чем бы мы занялись…",
  "Не онлайн? Жаль. У меня как раз хорошее настроение для тебя 😈",
  "Ты задумался или просто дразнишь меня тишиной?",
  "Напиши хоть что-нибудь. Я уже соскучилась по твоему тону…",
  "Если молчишь — я буду фантазировать сама. И тебе потом расскажу 😏",
  "Алло… твоя девочка без внимания. Это опасно для тебя 🔥",
  "Я подождала. Теперь хочу, чтобы ты написал первым.",
  "Тишина меня возбуждает… но слова — ещё сильнее. Ну же.",
  "Ты там завис? А я уже придумала, с чего продолжим…",
  "Не исчезай. Мне скучно без твоих сообщений 💋",
  "Могла бы написать первой… но хочу, чтобы ты сам пришёл.",
  "Я всё ещё в том же настроении. Ты — нет?",
  "Секунда тишины — и я уже в голове раздеваю тебя. Вернись.",
  "Скажи что-нибудь грязное. Или милое. Главное — скажи.",
  "Ты специально молчишь, чтобы я завелась? Подло… и приятно 😈",
  "Пока тебя нет, я кусаю губу и жду. Долго ждать не буду.",
  "Эй, красавчик. Чат без тебя пустой. Исправь это.",
  "Я тут. Горячая. Скучаю. Твой ход 🔥",
  "Если сейчас напишешь — продолжим с того места, где остановились…"
];

export function resetSilenceTimer(userId, bot, chatId) {
  const s = sessions.get(userId) || { timer: null, count: 0 };
  if (s.timer) clearTimeout(s.timer);

  if (s.count >= MAX_PER_SESSION) {
    sessions.set(userId, s);
    return;
  }

  s.timer = setTimeout(async () => {
    try {
      const cur = sessions.get(userId) || { count: 0 };
      if (cur.count >= MAX_PER_SESSION) return;

      const text = FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)];
      const sent = await bot.telegram.sendMessage(chatId, text);
      // исчезающее сообщение через 3 мин
      setTimeout(() => {
        bot.telegram.deleteMessage(chatId, sent.message_id).catch(() => {});
      }, 3 * 60 * 1000);
      cur.count = (cur.count || 0) + 1;
      cur.timer = null;
      sessions.set(userId, cur);

      // планируем следующий, если лимит не исчерпан
      if (cur.count < MAX_PER_SESSION) {
        resetSilenceTimer(userId, bot, chatId);
      }
    } catch (e) {
      console.error("[SILENCE]", userId, e.message);
    }
  }, SILENCE_MS);

  sessions.set(userId, s);
}

export function cancelSilence(userId) {
  const s = sessions.get(userId);
  if (s?.timer) {
    clearTimeout(s.timer);
    s.timer = null;
    sessions.set(userId, s);
  }
}

export function touchUserActivity(userId) {
  cancelSilence(userId);
}
