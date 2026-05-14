const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/purchases/:userId — покупки пользователя
router.get('/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.title, c.emoji, c.language, c.tier AS course_tier
       FROM purchases p JOIN courses c ON c.id = p.course_id
       WHERE p.user_id = $1 AND p.status = 'confirmed'
       ORDER BY p.created_at DESC`,
      [req.params.userId]
    );
    res.json({ success: true, purchases: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/purchases — совершить покупку
router.post('/', async (req, res) => {
  const { user_id, course_id, tier, amount, payer_name, payer_email, card_last_four } = req.body;
  if (!user_id || !course_id || !tier || amount === undefined)
    return res.status(400).json({ success: false, error: 'Не хватает полей' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO purchases (user_id, course_id, tier, amount, status, payer_name, payer_email, card_last_four, confirmed_at)
       VALUES ($1,$2,$3,$4,'confirmed',$5,$6,$7,NOW()) RETURNING *`,
      [user_id, course_id, tier, amount, payer_name, payer_email, card_last_four]
    );
    // Обновляем счётчик студентов курса
    await pool.query(
      'UPDATE courses SET total_students = total_students + 1 WHERE id = $1',
      [course_id]
    );
    res.status(201).json({ success: true, purchase: rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, error: 'Курс уже куплен' });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
