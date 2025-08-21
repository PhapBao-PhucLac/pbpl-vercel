module.exports = async function (req, res) {
  res.status(200).json({
    ok: true,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    origin: process.env.ALLOW_ORIGIN || '*'
  });
};
