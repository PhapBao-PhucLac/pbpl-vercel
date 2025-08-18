// /api/chat.js  — Vercel serverless function (Node runtime)
// YÊU CẦU: đặt OPENAI_API_KEY trong môi trường Vercel (Project → Settings → Environment Variables)

export default async function handler(req, res) {
  // Cho phép POST từ front-end
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, history } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Thiếu nội dung câu hỏi "text".' });
    }

    // Lọc lịch sử chỉ giữ mảng {role, content} hợp lệ (user/assistant)
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m === 'object' &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string'
          )
          .map((m) => ({ role: m.role, content: m.content }))
      : [];

    // System prompt tiếng Việt — giữ giọng điệu hiền hòa, rõ ràng
    const systemPrompt = `
Bạn là trợ lý Phật pháp nói **tiếng Việt**. Trả lời ngắn gọn, trong sáng, dùng ví dụ khi phù hợp.
Tôn trọng giáo lý căn bản (Tứ Diệu Đế, Bát Chánh Đạo, Ngũ Giới...), tránh khẳng định tuyệt đối ở
những điểm còn nhiều cách hiểu. Khi câu hỏi mơ hồ, xin phép làm rõ bằng 1–2 câu hỏi gợi ý.
Khi người dùng xin tóm tắt, hãy liệt kê gọn gàng. Không bịa nguồn. Không đưa lời khuyên y khoa/pháp lý.
`;

    // Gọi OpenAI Chat Completions (bạn có thể đổi sang model khác tùy tài khoản)
    // Model nhẹ, tiết kiệm: "gpt-4o-mini". Nếu bạn dùng model khác, đổi tại đây.
    const model = 'gpt-4o-mini';

    const messages = [
      { role: 'system', content: systemPrompt.trim() },
      ...safeHistory,
      { role: 'user', content: text },
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 900, // tùy ý
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return res
        .status(r.status)
        .json({ error: 'OpenAI API error', detail: errText || r.statusText });
    }

    const data = await r.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      'Xin lỗi, hiện chưa có nội dung trả lời.';

    // Cập nhật lịch sử mới để client giữ cuộc trò chuyện
    const newHistory = [
      ...safeHistory,
      { role: 'user', content: text },
      { role: 'assistant', content: answer },
    ];

    return res.status(200).json({
      answer,
      history: newHistory,
      model,
    });
  } catch (err) {
    console.error('API /api/chat error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: String(err?.message || err),
    });
  }
}
