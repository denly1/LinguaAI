const express = require('express');
const router = express.Router();
const pool = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// POST /api/broadcast/email
router.post('/email', async (req, res) => {
  const { subject, html, target } = req.body;
  if (!subject || !html) return res.status(400).json({ success: false, error: 'subject и html обязательны' });

  try {
    let emails = [];
    if (target === 'all') {
      const { rows } = await pool.query('SELECT email FROM users WHERE is_active = TRUE');
      emails = rows.map(r => r.email);
    } else if (target === 'admins') {
      const { rows } = await pool.query("SELECT email FROM users WHERE role = 'admin' AND is_active = TRUE");
      emails = rows.map(r => r.email);
    } else if (target === 'managers') {
      const { rows } = await pool.query("SELECT email FROM users WHERE role = 'manager' AND is_active = TRUE");
      emails = rows.map(r => r.email);
    } else if (Array.isArray(target)) {
      emails = target;
    }

    const results = [];
    for (const email of emails) {
      try {
        const info = await transporter.sendMail({
          from: `"LinguaAI" <${process.env.MAIL_USER || 'no-reply@linguaai.ru'}>`,
          to: email,
          subject,
          html,
        });
        results.push({ email, success: true });
      } catch (e) {
        results.push({ email, success: false, error: e.message });
      }
    }
    res.json({ success: true, sent: results.filter(r => r.success).length, total: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
