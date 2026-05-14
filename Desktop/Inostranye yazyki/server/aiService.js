const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m2.5:free';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function chatWithAI({ messages, temperature = 0.7, maxTokens = 1024, model }) {
  if (!OPENROUTER_API_KEY) {
    return { success: false, error: 'OPENROUTER_API_KEY не задан на сервере' };
  }

  const payload = {
    model: model || OPENROUTER_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': APP_URL,
        'X-Title': 'LinguaAI',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Chat API error', res.status, text);
      return { success: false, error: `Chat API ${res.status}`, details: text };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { success: true, content, model: data?.model, usage: data?.usage };
  } catch (err) {
    console.error('Chat API network error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { chatWithAI, OPENROUTER_MODEL };
