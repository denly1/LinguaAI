const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/courses — опубликованные курсы
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC`
    );
    res.json({ success: true, courses: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/courses/all — все курсы (для менеджера/админа)
router.get('/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json({ success: true, courses: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/courses/stats — статистика для менеджера
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM manager_course_stats');
    res.json({ success: true, stats: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/courses/:id/lessons
router.get('/:id/lessons', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY sort_order',
      [req.params.id]
    );
    res.json({ success: true, lessons: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/courses — создать курс (менеджер)
router.post('/', async (req, res) => {
  const { title, description, language, level, tier, price, cover_color, emoji, features, created_by } = req.body;
  try {
    const normalLevel = (level || 'beginner').replace(/-/g, '_');
    let featArr = features || [];
    if (typeof featArr === 'string') { try { featArr = JSON.parse(featArr); } catch { featArr = []; } }
    const { rows } = await pool.query(
      `INSERT INTO courses (title, description, language, level, tier, price, cover_color, emoji, features, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, language, normalLevel, tier || 'standard',
       price || 0, cover_color || '#6366f1', emoji || '📚',
       featArr, created_by]
    );
    res.status(201).json({ success: true, course: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/courses/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'published', 'archived'];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, error: 'Недопустимый статус' });
  try {
    await pool.query('UPDATE courses SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/courses/bulk/status — массовая смена статуса
router.post('/bulk/status', async (req, res) => {
  const { ids, status } = req.body;
  const allowed = ['draft', 'published', 'archived'];
  if (!Array.isArray(ids) || ids.length === 0 || !allowed.includes(status))
    return res.status(400).json({ success: false, error: 'ids[] и корректный status обязательны' });
  try {
    await pool.query(`UPDATE courses SET status = $1 WHERE id = ANY($2)`, [status, ids]);
    res.json({ success: true, updated: ids.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/courses/bulk/delete — массовое удаление
router.post('/bulk/delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, error: 'ids[] обязателен' });
  try {
    await pool.query(`DELETE FROM courses WHERE id = ANY($1)`, [ids]);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/courses/:id/duplicate — дублировать курс
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Курс не найден' });
    const c = rows[0];
    const { rows: newRows } = await pool.query(
      `INSERT INTO courses (title, description, language, level, tier, price, cover_color, emoji, features, created_by, status, total_students, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',0,0) RETURNING *`,
      [`${c.title} (копия)`, c.description, c.language, c.level, c.tier, c.price, c.cover_color, c.emoji, c.features, c.created_by]
    );
    res.status(201).json({ success: true, course: newRows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/courses/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS user_name FROM course_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.course_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, reviews: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
