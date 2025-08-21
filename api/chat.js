// api/chat.js — Vercel Serverless Function (không dùng thư viện, chỉ fetch)
// Trả về: { reply: string, meta?: { model, usage, requestId } }

const allowOrigin = process.env.ALLOW_ORIGIN || "*";

module.exports = async function (req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method Not Allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[api/chat] Missing OPENAI_API_KEY");
    return res.status(500).json({ reply: "Thiếu cấu hình máy chủ (OPENAI_API_KEY)." });
  }

  // Đọc body (Vercel thường parse sẵn)
  let body = req.body;
  if (!body || typeof body !== "object") {
    try { body = JSON.parse(await readBody(req)); } catch { body = {}; }
  }

  const message = (body?.message ?? "").toString();
  const history = Array.isArray(body?.history) ? body.history : [];
  if (!message.trim()) return res.status(400).json({ reply: 'Thiếu "message" trong body.' });

  // Gọn lịch sử
  const safeHistory = history.slice(-20).map(m => ({
    role: m?.role === "user" ? "user" : "assistant",
    content: (m?.content ?? "").toString().slice(0, 2000),
  }));

  const messages = [
    { role: "system",
      content: "Bạn là Chatbot Pháp Bảo Phúc Lạc. Trả lời ngắn gọn, dễ hiểu, đúng chánh pháp; văn phong từ hòa, lễ độ." },
    ...safeHistory,
    { role: "user", content: message.slice(0, 4000) },
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 700,
      })
    });

    const ct = r.headers.get("content-type") || "";
    const raw = ct.includes("application/json") ? await r.json() : await r.text();

    if (!r.ok) {
      console.error("[api/chat] OpenAI error:", r.status, raw);
      return res.status(r.status).json({
        reply: "OpenAI trả lỗi.",
        error: typeof raw === "string" ? raw : (raw?.error?.message || raw)
      });
    }

    const reply = raw?.choices?.[0]?.message?.content || "";
    const meta  = { model: raw?.model, usage: raw?.usage, requestId: raw?.id };

    console.log("[api/chat] OK", meta);
    return res.status(200).json({ reply, meta });
  } catch (err) {
    console.error("[api/chat] FETCH ERROR", err);
    return res.status(500).json({ reply: "Xin lỗi, máy chủ gặp lỗi khi gọi OpenAI.", error: err?.message || String(err) });
  }
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
