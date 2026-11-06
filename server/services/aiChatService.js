



const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const getCareerAdvice = async (messages) => {
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

    contents,

    config: {
      systemInstruction: `
        You are CareerConnect AI, a professional career assistant.

        Help candidates with:
        1. Resume improvement
        2. Career guidance
        3. Technical skills recommendations
        4. Interview preparation
        5. Job search strategies
        6. Project recommendations

        Give practical suggestions in simple English.
        Be friendly and supportive.
        Never invent job vacancies.
        Never guarantee employment.
      `,
      maxOutputTokens: 700,
    },
  });

  return response.text;
};

module.exports = { getCareerAdvice };
