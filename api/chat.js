// api/chat.js — Vercel Serverless Function (CommonJS, an toàn)
// Trả về: { reply: string, meta?: { model, usage, requestId } }

const OpenAI = require("openai");

const allowOrigin = process.env.ALLOW_ORIGIN || "*";

module.exports = async function (req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method Not Allowed" });

  if (!process.env.OPENAI_API_KEY) {
    console.error("[api/chat] Missing OPENAI_API_KEY");
    return res.status(500).json({ reply: "Thiếu cấu hình máy chủ (OPENAI_API_KEY)." });
  }

  // Đọc body an toàn (Vercel thường parse sẵn)
  let body = req.body;
  if (!body || typeof body !== "object") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }

  const message = String(body?.message || "");
  const history = Array.isArray(body?.history) ? body.history : [];
  if (!message.trim()) return res.status(400).json({ reply: 'Thiếu "message" trong body.' });

  // Chuẩn hóa lịch sử
  const safeHistory = history.slice(-20).map((m) => ({
    role: m?.role === "user" ? "user" : "assistant",
    content: String(m?.content || "").slice(0, 2000),
  }));

  const messages = [
    {
      role: "system",
      content:
        "Bạn là Chatbot Pháp Bảo Phúc Lạc. Trả lời ngắn gọn, dễ hiểu, đúng chánh pháp; văn phong từ hòa, lễ độ. Nếu câu hỏi vượt phạm vi, hãy khéo léo hướng dẫn an toàn.",
    },
    ...safeHistory,
    { role: "user", content: message.slice(0, 4000) },
  ];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 700,
      messages,
    });

    const reply = completion?.choices?.[0]?.message?.content || "";
    const meta = {
      model: completion?.model || (process.env.OPENAI_MODEL || "gpt-4o-mini"),
      usage: completion?.usage || null,
      requestId: completion?.id || null,
    };

    console.log("[api/chat] OK", meta);
    return res.status(200).json({ reply, meta });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const detail =
      err?.message ||
      (typeof err?.response?.data === "string" ? err.response.data : JSON.stringify(err?.response?.data || {}));
    console.error("[api/chat] ERROR", status, detail);
    return res.status(status).json({
      reply: "Xin lỗi, máy chủ gặp lỗi. Vui lòng thử lại sau.",
      error: detail,
    });
  }
};
