const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'email и password обязательны' });

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, u.total_xp, u.streak, u.avatar, u.created_at, u.last_login
       FROM users u
       WHERE u.email = lower($1)
         AND u.password_hash = crypt($2, u.password_hash)
         AND u.is_active = TRUE`,
      [email.trim(), password]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' });

    // Обновляем last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [rows[0].id]);

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: 'name, email и password обязательны' });

  try {
    const { rows } = await pool.query(
      'SELECT register_user($1, $2, $3) AS id',
      [name.trim(), email.toLowerCase().trim(), password]
    );
    const userId = rows[0].id;

    const user = await pool.query(
      'SELECT id, email, name, role, is_active, total_xp, streak, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );
    res.status(201).json({ success: true, user: user.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, error: 'Пользователь с таким email уже существует' });
    console.error('register error:', err.message);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

module.exports = router;
