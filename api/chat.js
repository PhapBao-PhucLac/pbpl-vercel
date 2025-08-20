// api/chat.js - Bản kiểm tra đơn giản, chưa gọi AI
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Trả về một câu cố định để biết API chạy
  return res.status(200).json({
    ok: true,
    text: "API hoạt động ✅ (bản kiểm tra không dùng AI)."
  });
}
