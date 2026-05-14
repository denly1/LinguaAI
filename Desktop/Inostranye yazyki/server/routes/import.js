const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/import/courses
// body: { courses: [...] } — массив объектов курсов
router.post('/courses', async (req, res) => {
  const { courses, created_by } = req.body;
  if (!Array.isArray(courses) || courses.length === 0)
    return res.status(400).json({ success: false, error: 'courses[] обязателен' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const c of courses) {
      const { rows } = await client.query(
        `INSERT INTO courses (title, description, language, level, tier, price, cover_color, emoji, features, created_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft') RETURNING *`,
        [
          c.title, c.description || '', c.language || 'en',
          (c.level || 'beginner').replace(/-/g, '_'), c.tier || 'standard',
          c.price || 0, c.cover_color || '#6366f1', c.emoji || '📚',
          Array.isArray(c.features) ? c.features : [],
          created_by || null
        ]
      );
      inserted.push(rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, count: inserted.length, courses: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/import/users
router.post('/users', async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0)
    return res.status(400).json({ success: false, error: 'users[] обязателен' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const u of users) {
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, lower($2), crypt($3, gen_salt('bf')), $4, TRUE) RETURNING id, name, email, role, is_active`,
        [u.name, u.email, u.password || 'changeme', u.role || 'user']
      );
      inserted.push(rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, count: inserted.length, users: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Дубликат email' });
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
