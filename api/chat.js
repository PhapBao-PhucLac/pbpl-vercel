// api/chat.js — bản debug có log chi tiết

export default async function handler(req, res) {
  // CORS (cho phép gọi từ trình duyệt)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Chỉ cho POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Kiểm tra API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("[/api/chat] Missing OPENAI_API_KEY");
    return res.status(500).json({
      ok: false,
      error: "OPENAI_API_KEY is not set on the server",
    });
  }

  try {
    // Đọc body
    const { message, system, model = "gpt-4o-mini" } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ ok: false, error: "Missing 'message' string" });
    }

    // Prompt hệ thống mặc định (giọng điệu nhẹ nhàng – Việt ngữ)
    const defaultSystem =
      "Bạn là trợ lý Phật học nói tiếng Việt, giọng điệu từ ái, nhẹ nhàng, gần gũi. " +
      "Giải thích mạch lạc, ngắn gọn đủ ý, có ví dụ khi phù hợp. " +
      "Nếu là khái niệm Phật học: nêu định nghĩa (ngắn), ý nghĩa thực hành (ứng dụng đời sống), " +
      "và gợi ý 1–2 câu hỏi mở để tiếp tục trao đổi.";

    const messages = [
      { role: "system", content: system || defaultSystem },
      { role: "user", content: message },
    ];

    // Timeout an toàn (30s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
      }),
    }).catch((err) => {
      // Lỗi mạng/timeout
      console.error("[/api/chat] Network error:", err);
      throw new Error("Network/timeout error when calling OpenAI");
    });
    clearTimeout(timeout);

    const requestId =
      resp.headers.get("x-request-id") ||
      resp.headers.get("openai-request-id") ||
      null;

    // Nếu OpenAI trả non-200
    if (!resp.ok) {
      let errPayload = null;
      try {
        errPayload = await resp.json();
      } catch {
        // ignore
      }

      console.error("[/api/chat] OpenAI non-OK", {
        status: resp.status,
        requestId,
        errPayload,
      });

      return res.status(500).json({
        ok: false,
        error: errPayload?.error?.message || `OpenAI error (${resp.status})`,
        status: resp.status,
        requestId,
      });
    }

    // Đọc JSON kết quả
    const data = await resp.json();

    // Trường hợp OpenAI có error trong payload
    if (data?.error) {
      console.error("[/api/chat] OpenAI payload error", {
        requestId,
        error: data.error,
      });
      return res.status(500).json({
        ok: false,
        error: data.error.message || "OpenAI returned an error",
        requestId,
      });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim() || "";

    // Ghi log tóm tắt để truy vết nhanh trong Runtime Logs
    console.log("[/api/chat] OK", {
      requestId,
      model: data?.model || model,
      usage: data?.usage,
      question: message.slice(0, 80), // cắt để gọn log
      answerPreview: answer.slice(0, 80),
    });

    return res.status(200).json({
      ok: true,
      model: data?.model || model,
      usage: data?.usage || null,
      requestId,
      answer,
    });
  } catch (err) {
    // Bắt mọi lỗi còn lại
    console.error("[/api/chat] Uncaught error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal Server Error",
    });
  }
}
