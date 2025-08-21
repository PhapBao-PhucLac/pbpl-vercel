// api/chat-stream.js — Vercel Serverless (streaming SSE, không cần thư viện)
// Yêu cầu: OPENAI_API_KEY (đã set ở Project). Tuỳ chọn: OPENAI_MODEL, ALLOW_ORIGIN.

const allowOrigin = process.env.ALLOW_ORIGIN || "*";

module.exports = async function (req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).end("Missing OPENAI_API_KEY");

  // Lấy body an toàn
  let body = req.body;
  if (!body || typeof body !== "object") {
    try { body = JSON.parse(await readBody(req)); } catch { body = {}; }
  }
  const message = (body?.message ?? "").toString();
  const history = Array.isArray(body?.history) ? body.history : [];
  if (!message.trim()) return res.status(400).end('Missing "message"');

  // Gọn lịch sử
  const safeHistory = history.slice(-20).map(m => ({
    role: m?.role === "user" ? "user" : "assistant",
    content: (m?.content ?? "").toString().slice(0, 2000),
  }));

  const messages = [
    {
      role: "system",
      content:
        "Bạn là Chatbot Pháp Bảo Phúc Lạc. Trả lời ngắn gọn, dễ hiểu, đúng chánh pháp; văn phong từ hòa, lễ độ.",
    },
    ...safeHistory,
    { role: "user", content: message.slice(0, 4000) },
  ];

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 700,
        stream: true,
      }),
    });

    // Lỗi từ OpenAI
    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).end(errText);
      return;
    }

    // Gửi SSE về client
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of upstream.body) {
      // chuyển nguyên văn SSE "data: {...}\n\n"
      res.write(chunk);
    }
    res.end();
  } catch (e) {
    res.status(500).end(e?.message || String(e));
  }
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
