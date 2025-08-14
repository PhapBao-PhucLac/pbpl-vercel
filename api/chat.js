export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse JSON body cho chắc chắn (Vercel Node func có thể đưa body dạng string)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { messages = [] } = body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' });

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const SYSTEM_PROMPT = 'Bạn là Pháp Bảo Phúc Lạc — trợ lý Phật học từ bi, khiêm cung, trả lời rõ ràng, súc tích; trích dẫn khi phù hợp; nhắc thực hành chánh niệm.';
    const finalMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.filter(m => m && m.role && m.content)];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: finalMessages, temperature: 0.2 })
    });

    if (!r.ok) return res.status(502).json({ error: 'Upstream error', detail: await r.text() });
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return res.json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
