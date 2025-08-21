// api/chat.js — Vercel Serverless Function (Node runtime)
// Gọi OpenAI và trả lời Markdown tiếng Việt, nhẹ nhàng – từ ái
// API trả về đồng thời cả "answer" và "text" để tương thích frontend cũ/mới.

const SYS_PROMPT = `Bạn là "Pháp Bảo Phúc Lạc • Chatbot".
Phong cách: từ ái, nhẹ nhàng, dễ hiểu, ví dụ ngắn gọn, tránh phán xét.
Trả lời bằng **Markdown** tiếng Việt, tiêu đề/ý chính dùng **bold** (không dùng ###).
Nếu người dùng hỏi các chủ đề Phật học, hãy:
- Tóm tắt gọn phần "Cốt lõi".
- Triển khai 3–5 ý rõ ràng (gạch đầu dòng).
- Nếu phù hợp, thêm "Ứng dụng thực hành" đơn giản.
- Cuối cùng **gợi ý 1–2 câu hỏi mở** để người dùng tiếp tục khai triển.

Tránh khẳng định tuyệt đối; dùng ngôn ngữ bao dung, khuyến khích quán chiếu.
Nếu câu hỏi ngoài phạm vi, lịch sự nói không chắc và đề xuất hướng hỏi khác.`;

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // ổn định & tiết kiệm. Có thể đổi "gpt-5-mini" nếu tài khoản hỗ trợ.

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export default async function handler(req, res) {
  cors(res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET: kiểm tra nhanh
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ ok: true, text: "API hoạt động ✅ (chưa nhận được câu hỏi)." });
  }

  // Chỉ nhận POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const message = (body?.message || body?.question || "").toString().trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Thiếu OPENAI_API_KEY trong Vercel Environment Variables.",
      });
    }

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Thiếu 'message' trong request body.",
      });
    }

    // Chuyển history (nếu có) về định dạng OpenAI
    const historyMsgs = history
      .filter(m => m && (m.role === "user" || m.role === "assistant") && m.content)
      .map(m => ({ role: m.role, content: m.content.toString() }));

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: SYS_PROMPT },
        ...historyMsgs,
        { role: "user", content: message }
      ],
      temperature: 0.6,
      max_tokens: 800,
    };

    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      // Trả lỗi gọn để tiện debug
      return res.status(500).json({
        ok: false,
        error: data?.error?.message || "OpenAI trả lỗi không xác định.",
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Xin lỗi, hiện chưa có nội dung trả lời phù hợp.";

    // Trả về cả "answer" và "text" để frontend kiểu nào cũng đọc được
    return res.status(200).json({
      ok: true,
      answer,
      text: answer,
      model: MODEL,
      usage: data?.usage || null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: (err && err.message) || "Lỗi không xác định ở server.",
    });
  }
}
