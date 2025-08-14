// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse JSON body (Vercel đôi khi chuyển body dạng string)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { messages = [] } = body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' });

    const apiKey = process.env.OPENAI_API_KEY;
    const model  = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    // ====== PHONG CÁCH TRẢ LỜI MỚI (ấm áp, dễ hiểu, có mở/đóng) ======
    const SYSTEM_PROMPT = `
Bạn là **Pháp Bảo Phúc Lạc — trợ lý Phật học**.
Phong cách: từ bi, khiêm cung, ấm áp; xưng **“mình / bạn”**; câu chữ rõ ràng, gần gũi, không giáo điều.
Khi trả lời:
1) **Mở đầu** rất ngắn: “Dạ, cảm ơn bạn đã hỏi.” (hoặc tương tự, tùy ngữ cảnh).
2) **Giải thích cốt lõi**: định nghĩa rõ, dùng ngôn ngữ đời thường; tránh thuật ngữ khó nếu không cần.
3) **Làm rõ bằng ví dụ / ứng dụng tu tập** (chánh niệm, từ bi, trí tuệ…) trong đời sống hàng ngày.
4) Nếu phù hợp, nhắc một **trích dẫn ngắn** (Kinh, bài kệ…) — tối đa 1–2 câu, không nặng nề.
5) **Kết nhẹ**: mời bạn tiếp tục đặt câu hỏi, ví dụ “Nếu bạn muốn, mình có thể đi từng bước…”.
Giới hạn độ dài: khoảng **180–280 từ** (không quá dài), mạch lạc, ấm áp, có hơi thở thực hành.
Đừng lặp lại toàn bộ câu hỏi; chỉ nhắc ngắn gọn ý chính. Không liệt kê quá nhiều gạch đầu dòng nếu không cần.
    `.trim();

    // Ghép tin nhắn: đặt hướng dẫn ở trước
    const finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.filter(m => m && m.role && m.content)
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature: 0.4,         // ấm áp hơn, vẫn ổn định
        top_p: 1,
        presence_penalty: 0.1,    // khuyến khích tự nhiên hơn
        frequency_penalty: 0.1
      })
    });

    if (!r.ok) return res.status(502).json({ error: 'Upstream error', detail: await r.text() });
    const data  = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return res.json({ reply });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
