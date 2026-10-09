const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const MAX_MESSAGE_LENGTH = 2000;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

exports.geminiChat = onRequest(
  { secrets: [geminiApiKey], cors: true, timeoutSeconds: 30, maxInstances: 3, concurrency: 1 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json({ error: "Solo se admite POST." });
    }

    const message = req.body?.message;
    if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `El mensaje debe contener entre 1 y ${MAX_MESSAGE_LENGTH} caracteres.`,
      });
    }

    try {
      const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(geminiApiKey.value())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message.trim() }] }],
          generationConfig: { maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        logger.warn("Gemini API returned an unsuccessful response.", { status: response.status });
        return res.status(502).json({ error: "El servicio de IA no está disponible ahora." });
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter((text) => typeof text === "string")
        .join("");

      if (!reply) {
        logger.warn("Gemini API response did not include text.");
        return res.status(502).json({ error: "El servicio de IA devolvió una respuesta vacía." });
      }

      return res.status(200).json({ reply });
    } catch (error) {
      logger.error("Gemini chat request failed.", error);
      const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
      return res.status(timedOut ? 504 : 500).json({
        error: timedOut ? "El servicio de IA tardó demasiado en responder." : "No se pudo procesar el mensaje.",
      });
    }
});