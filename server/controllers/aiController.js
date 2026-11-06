


const { GoogleGenAI } = require("@google/genai");

const SYSTEM_PROMPT =
  "You are CareerConnect AI, a friendly career assistant on a job portal. " +
  "Help with resumes, skills, projects, interview prep, and job search. " +
  "Keep answers practical and concise. If a question is unrelated to careers, " +
  "politely steer back to career topics.";

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ message: "AI is not configured on the server" });
    }

    // Gemini calls the assistant role "model"
    const cleanHistory = (Array.isArray(history) ? history : [])
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    // History must start with a user message
    while (cleanHistory.length && cleanHistory[0].role !== "user") {
      cleanHistory.shift();
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [
        ...cleanHistory,
        { role: "user", parts: [{ text: message.trim() }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1000,
      },
    });

    res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ message: "AI request failed" });
  }
};