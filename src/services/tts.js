import path from "path";
import fs from "fs";

export async function generateVoice(text) {
  const filePath = path.join(process.cwd(), `temp_voice_${Date.now()}.mp3`);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        voice: "nova",
        input: text,
        response_format: "mp3"
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error("Ошибка генерации голоса:", error);
    return null;
  }
}
