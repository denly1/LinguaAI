const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/promocodes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM promocodes ORDER BY created_at DESC');
    res.json({ success: true, promocodes: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/promocodes
router.post('/', async (req, res) => {
  const { code, discount_percent, discount_amount, max_uses, expires_at, applicable_tiers, is_active } = req.body;
  if (!code) return res.status(400).json({ success: false, error: 'code обязателен' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO promocodes (code, discount_percent, discount_amount, max_uses, expires_at, applicable_tiers, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code.toUpperCase(), discount_percent || null, discount_amount || null, max_uses || null, expires_at || null, applicable_tiers || null, is_active !== false]
    );
    res.status(201).json({ success: true, promocode: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Промокод уже существует' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/promocodes/:id
router.patch('/:id', async (req, res) => {
  const { is_active, discount_percent, discount_amount, max_uses } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE promocodes SET is_active = COALESCE($1, is_active),
        discount_percent = COALESCE($2, discount_percent),
        discount_amount = COALESCE($3, discount_amount),
        max_uses = COALESCE($4, max_uses),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [is_active, discount_percent, discount_amount, max_uses, req.params.id]
    );
    res.json({ success: true, promocode: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/promocodes/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM promocodes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/promocodes/validate
router.post('/validate', async (req, res) => {
  const { code, tier } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promocodes WHERE code = upper($1) AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
      [code]
    );
    if (!rows.length) return res.json({ success: false, error: 'Промокод недействителен' });
    const promo = rows[0];
    if (promo.applicable_tiers && !promo.applicable_tiers.includes(tier))
      return res.json({ success: false, error: 'Промокод не применим к этому тарифу' });
    res.json({ success: true, promocode: promo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
