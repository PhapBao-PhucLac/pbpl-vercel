// /api/chat.js
export default async function handler(req, res) {
  // CORS nhẹ (nếu bạn nhúng domain khác)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages = [], temperature = 0.5, max_tokens = 600, model = 'gpt-4o-mini' } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  try {
    // Gọi OpenAI Chat Completions chuẩn & đơn giản, không stream
    const reply = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages
      })
    }).then(r => r.json());

    if (reply.error) {
      return res.status(500).json({ error: reply.error.message || 'OpenAI error' });
    }

    const text = reply.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
