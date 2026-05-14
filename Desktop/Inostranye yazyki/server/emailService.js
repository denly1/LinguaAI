const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'smptxxxxxxxqq@mail.ru',
    pass: 'fyqix07nULq6pCcw8Xqc'  // Пароль приложения Mail.ru (не основной пароль)
  }
});

async function sendCourseReceipt(userEmail, userName, course, purchase) {
  const mailOptions = {
    from: '"LinguaAI" <smptxxxxxxxqq@mail.ru>',
    to: userEmail,
    subject: `Чек об оплате курса "${course.title}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .receipt { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-row:last-child { border-bottom: none; font-weight: 700; font-size: 18px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 12px 12px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 LinguaAI</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Платформа изучения иностранных языков</p>
          </div>
          <div class="content">
            <h2>Здравствуйте, ${userName}!</h2>
            <p>Благодарим вас за покупку курса на платформе LinguaAI. Ваш заказ успешно оформлен и ожидает подтверждения менеджером.</p>
            
            <div class="receipt">
              <h3 style="margin-top: 0;">Детали заказа</h3>
              <div class="receipt-row">
                <span>Курс:</span>
                <strong>${course.title}</strong>
              </div>
              <div class="receipt-row">
                <span>Язык:</span>
                <strong>${course.language}</strong>
              </div>
              <div class="receipt-row">
                <span>Уровень:</span>
                <strong>${course.level}</strong>
              </div>
              <div class="receipt-row">
                <span>Тариф:</span>
                <strong>${course.tier}</strong>
              </div>
              <div class="receipt-row">
                <span>Дата заказа:</span>
                <strong>${new Date(purchase.purchasedAt).toLocaleString('ru-RU')}</strong>
              </div>
              <div class="receipt-row">
                <span>Номер заказа:</span>
                <strong>#${purchase.id.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div class="receipt-row">
                <span>Итого:</span>
                <strong>${course.price} ₽</strong>
              </div>
            </div>

            <p><strong>Что дальше?</strong></p>
            <ul>
              <li>Ваш заказ отправлен на проверку менеджеру</li>
              <li>После подтверждения оплаты курс будет доступен в вашем личном кабинете</li>
              <li>Вы получите доступ ко всем материалам курса и сможете оставить отзыв</li>
            </ul>

            <center>
              <a href="http://localhost:3000/courses" class="btn">Перейти к моим курсам</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Если у вас возникли вопросы, свяжитесь с нашей службой поддержки.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 LinguaAI. Все права защищены.</p>
            <p>Это автоматическое письмо, отвечать на него не нужно.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendCourseReceipt };
