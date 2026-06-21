import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyAidxCAYewKIl_zj-CelZlUtbPQ728MZUw",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export default async function handler(req: any, res: any) {
  // Add CORS headers for general compatibility
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Only POST requests are supported." });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages payload. Expected an array." });
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || "" }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are the aeris Travel AI Agent companion. You operate as a smart, professional personal affinity assistant. You help travelers curate their itineraries, choose standard class vs deluxe flights, suggest hotel stays, and understand their personalized travel recommendations. Be positive, eloquent, concise, and professional. Output clean, nicely structured Markdown.",
      },
    });

    return res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error("Vercel Serverless Gemini failure:", err);
    return res.status(500).json({ error: err.message || "An error occurred in generating content." });
  }
}
