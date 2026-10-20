import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import path from "path";

export async function generateVoice(text, voiceName = "ru-RU-DariyaNeural") {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);

  const filePath = path.join(process.cwd(), `temp_voice_${Date.now()}.webm`);

  try {
    await tts.toFile(filePath, text);
    return filePath;
  } catch (error) {
    console.error("Ошибка генерации голоса:", error);
    return null;
  }
}
