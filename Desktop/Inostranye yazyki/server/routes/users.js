const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/users — все пользователи (только для admin)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, role, is_active, total_xp, streak, avatar, created_at, last_login
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, is_active, total_xp, streak, avatar, native_language, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/users/:id/role
router.patch('/:id/role', async (req, res) => {
  const { role } = req.body;
  const allowed = ['guest', 'user', 'manager', 'admin'];
  if (!allowed.includes(role))
    return res.status(400).json({ success: false, error: 'Недопустимая роль' });

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/users/:id/active
router.patch('/:id/active', async (req, res) => {
  const { is_active } = req.body;
  try {
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/stats/admin — статистика для админа
router.get('/stats/admin', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM admin_user_stats ORDER BY total_xp DESC');
    res.json({ success: true, stats: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/stats/dashboard — сводка для дашборда
router.get('/stats/dashboard', async (req, res) => {
  try {
    const usersTotal = await pool.query('SELECT COUNT(*) AS total FROM users');
    const usersToday = await pool.query("SELECT COUNT(*) AS total FROM users WHERE created_at >= CURRENT_DATE");
    const coursesTotal = await pool.query('SELECT COUNT(*) AS total FROM courses');
    const purchasesTotal = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS revenue FROM purchases WHERE status = $1', ['confirmed']);
    const activeNow = await pool.query("SELECT COUNT(*) AS total FROM users WHERE last_login >= NOW() - INTERVAL '24 hours'");
    res.json({
      success: true,
      stats: {
        usersTotal: parseInt(usersTotal.rows[0].total, 10),
        usersToday: parseInt(usersToday.rows[0].total, 10),
        coursesTotal: parseInt(coursesTotal.rows[0].total, 10),
        purchasesTotal: parseInt(purchasesTotal.rows[0].total, 10),
        revenue: parseInt(purchasesTotal.rows[0].revenue, 10),
        activeNow: parseInt(activeNow.rows[0].total, 10),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
