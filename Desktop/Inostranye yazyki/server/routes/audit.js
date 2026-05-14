const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT 200`
    );
    res.json({ success: true, logs: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit/stats
router.get('/stats', async (req, res) => {
  try {
    const byAction = await pool.query(
      `SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC`
    );
    const byDay = await pool.query(
      `SELECT DATE(created_at) as day, COUNT(*) as count FROM audit_log WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY day ORDER BY day DESC`
    );
    res.json({ success: true, byAction: byAction.rows, byDay: byDay.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
