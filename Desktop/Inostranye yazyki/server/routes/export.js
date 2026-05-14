const express = require('express');
const router = express.Router();
const pool = require('../db');

function toCsv(rows, headers) {
  if (!rows.length) return headers.join(';') + '\n';
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push(headers.map(h => {
      const v = r[h] ?? r[h.toLowerCase().replace(/ /g, '_')] ?? '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(';') || s.includes('\n') ? `"${s}"` : s;
    }).join(';'));
  });
  return lines.join('\n');
}

function sendCsv(res, filename, data) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + data);
}

// GET /api/export/courses/csv
router.get('/courses/csv', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.title, c.description, c.language, c.level, c.tier, c.price, c.status,
             c.total_students, c.rating, c.created_at, u.name AS created_by_name
      FROM courses c LEFT JOIN users u ON u.id = c.created_by
      ORDER BY c.created_at DESC
    `);
    const csv = toCsv(rows, ['id','title','description','language','level','tier','price','status','total_students','rating','created_at','created_by_name']);
    sendCsv(res, 'courses.csv', csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export/users/csv
router.get('/users/csv', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, email, name, role, is_active, total_xp, streak, created_at, last_login
      FROM users ORDER BY created_at DESC
    `);
    const csv = toCsv(rows, ['id','email','name','role','is_active','total_xp','streak','created_at','last_login']);
    sendCsv(res, 'users.csv', csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export/purchases/csv
router.get('/purchases/csv', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.user_id, u.name AS user_name, u.email AS user_email,
             p.course_id, c.title AS course_title, p.tier, p.amount, p.status,
             p.payer_name, p.payer_email, p.card_last_four, p.created_at, p.confirmed_at
      FROM purchases p
      JOIN users u ON u.id = p.user_id
      JOIN courses c ON c.id = p.course_id
      ORDER BY p.created_at DESC
    `);
    const csv = toCsv(rows, ['id','user_id','user_name','user_email','course_id','course_title','tier','amount','status','payer_name','payer_email','card_last_four','created_at','confirmed_at']);
    sendCsv(res, 'purchases.csv', csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export/stats/csv  — сводная статистика
router.get('/stats/csv', async (req, res) => {
  try {
    const courses = await pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='published') as published FROM courses`);
    const users = await pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE role='admin') as admins, COUNT(*) FILTER (WHERE role='manager') as managers FROM users`);
    const purchases = await pool.query(`SELECT COUNT(*) as total, COALESCE(SUM(amount),0) as revenue FROM purchases WHERE status='confirmed'`);
    const rows = [
      { metric: 'Всего курсов', value: courses.rows[0].total },
      { metric: 'Опубликовано курсов', value: courses.rows[0].published },
      { metric: 'Всего пользователей', value: users.rows[0].total },
      { metric: 'Админов', value: users.rows[0].admins },
      { metric: 'Менеджеров', value: users.rows[0].managers },
      { metric: 'Всего покупок', value: purchases.rows[0].total },
      { metric: 'Общая выручка', value: purchases.rows[0].revenue },
    ];
    const csv = toCsv(rows, ['metric','value']);
    sendCsv(res, 'stats.csv', csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
