// api/chat.js — Serverless Function (Node.js) cho Vercel
export default async function handler(req, res) {
  // Cho phép thử nhanh từ trình duyệt, không cần sửa CORS lúc đầu
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // Lấy dữ liệu client gửi lên (messages hoặc prompt)
    const body = req.body || {};
    const messages =
      body.messages && Array.isArray(body.messages)
        ? body.messages
        : [{ role: "user", content: String(body.prompt || "") }];

    // Gọi OpenAI Chat Completions (ổn định, dễ dùng)
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      // Trả nguyên lỗi để dễ debug ở client
      return res.status(r.status).json({
        error: "OpenAI API error",
        status: r.status,
        data,
      });
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim?.() ??
      "(Không nhận được nội dung trả lời)";

    // Trả về định dạng đơn giản cho frontend
    return res.status(200).json({ ok: true, text });
  } catch (err) {
    console.error("API /api/chat error:", err);
    return res.status(500).json({
      error: "Server error",
      detail: String(err?.message || err),
    });
  }
}
