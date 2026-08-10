const API_URL = "https://pay.crypt.bot/api";

export async function createCryptoInvoice({ amountRub, description, payload }) {
  const token = process.env.CRYPTOBOT_TOKEN;
  if (!token) {
    console.error("[CryptoBot] Нет CRYPTOBOT_TOKEN");
    return null;
  }
  try {
    const params = new URLSearchParams({
      currency_type: "fiat",
      fiat: "RUB",
      amount: String(amountRub),
      accepted_assets: "USDT,TON,BTC",
      description: description || "Оплата пакета Aura AI",
      payload: payload || "",
      expires_in: "1800",
      paid_btn_name: "callback",
      paid_btn_url: "https://t.me/evaflirt_bot"
    });
    const response = await fetch(API_URL + "/createInvoice?" + params.toString(), {
      method: "GET",
      headers: { "Crypto-Pay-API-Token": token }
    });
    const data = await response.json();
    console.log("=== CRYPTOBOT CREATE ===", JSON.stringify(data));
    if (!data.ok) {
      console.error("[CryptoBot] Ошибка:", data);
      return null;
    }
    return data.result;
  } catch (e) {
    console.error("[CryptoBot] Сеть:", e);
    return null;
  }
}

export async function getCryptoInvoice(invoiceId) {
  const token = process.env.CRYPTOBOT_TOKEN;
  try {
    const response = await fetch(API_URL + "/getInvoices?invoice_ids=" + invoiceId, {
      method: "GET",
      headers: { "Crypto-Pay-API-Token": token }
    });
    const data = await response.json();
    console.log("=== CRYPTOBOT GET ===", JSON.stringify(data));
    if (!data.ok || !data.result) return null;
    const items = Array.isArray(data.result) ? data.result : (data.result.items || []);
    if (!items.length) return null;
    return items[0];
  } catch (e) {
    console.error("[CryptoBot] Check error:", e);
    return null;
  }
}
