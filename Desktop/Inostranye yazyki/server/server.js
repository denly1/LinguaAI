try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }

const express = require('express');
const cors = require('cors');
const { sendCourseReceipt } = require('./emailService');
const { chatWithAI, OPENROUTER_MODEL } = require('./aiService');

// DB — подключение к PostgreSQL
require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Роуты БД ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/courses',   require('./routes/courses'));
app.use('/api/purchases', require('./routes/purchases'));

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: OPENROUTER_MODEL, time: new Date().toISOString() });
});

// ── Email: чек об оплате курса ───────────────────────────────────────────────
app.post('/api/send-receipt', async (req, res) => {
  try {
    const { userEmail, userName, course, purchase } = req.body;
    if (!userEmail || !userName || !course || !purchase) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await sendCourseReceipt(userEmail, userName, course, purchase);
    if (result.success) res.json({ success: true, message: 'Receipt sent successfully' });
    else res.status(500).json({ success: false, error: result.error });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Чат-тьютор: прокси ─────────────────────────────────────────────────────
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, temperature, maxTokens, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages[] is required' });
    }
    const result = await chatWithAI({ messages, temperature, maxTokens, model });
    if (result.success) res.json(result);
    else res.status(502).json(result);
  } catch (error) {
    console.error('AI proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`LinguaAI server running on http://localhost:${PORT}`);
  console.log(`  Chat model: ${OPENROUTER_MODEL}`);
});
