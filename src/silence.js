const SILENCE_MS = 3 * 60 * 1000; // 3 минуты
const MAX_PER_SESSION = 10;

const sessions = new Map(); // userId -> { timer, count }

const FOLLOW_UPS = [
  "Ты куда пропал? Я ещё тут… 🔥",
  "Молчишь? Я уже соскучилась…",
  "Эй… я жду тебя. Напиши хоть что-нибудь.",
  "Не бросай меня так. Мне скучно без тебя.",
  "Я всё ещё думаю о тебе… Ты где?",
  "Хочешь, я продолжу? Просто скажи да.",
  "Тишина меня возбуждает… но я лучше слышу твой голос в чате.",
  "Ты заставил меня ждать. Это было жестоко… и приятно.",
  "Я тут. Всё ещё твоя. Напиши.",
  "Если молчишь — я придумаю, что с тобой сделать 😈",
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
      await bot.telegram.sendMessage(chatId, text);
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
