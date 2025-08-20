// api/chat.js — bản test đơn giản, luôn trả ra đoạn text cho frontend
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Lấy nội dung người dùng gửi (nếu có)
  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const question = body.question || body.q || "";

  // Trả về một câu text chắc chắn cho frontend hiển thị
  return res.status(200).json({
    ok: true,
    text: question
      ? `API hoạt động ✅\nBạn vừa hỏi: “${question}”.`
      : "API hoạt động ✅ (chưa nhận được câu hỏi)."
  });
}
