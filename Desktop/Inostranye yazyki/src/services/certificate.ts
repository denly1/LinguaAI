export interface CertificateData {
  studentName: string;
  courseName: string;
  language: string;
  level: string;
  completedDate: string;
  score?: number;
}

const LANG_FLAG: Record<string, string> = {
  en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸',
  it: '🇮🇹', zh: '🇨🇳', ja: '🇯🇵', pt: '🇧🇷',
};

export function generateCertificate(data: CertificateData): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 1200, 850);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 850);

  // Decorative border
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 790);
  ctx.strokeStyle = 'rgba(99,102,241,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 1120, 770);

  // Corner decorations
  const corners = [[60, 60], [1140, 60], [60, 790], [1140, 790]];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
  });

  // Gold top accent line
  const accent = ctx.createLinearGradient(100, 0, 1100, 0);
  accent.addColorStop(0, 'transparent');
  accent.addColorStop(0.3, '#f59e0b');
  accent.addColorStop(0.7, '#fbbf24');
  accent.addColorStop(1, 'transparent');
  ctx.fillStyle = accent;
  ctx.fillRect(100, 80, 1000, 3);

  // Logo area
  ctx.fillStyle = 'rgba(99,102,241,0.2)';
  ctx.beginPath();
  ctx.roundRect(550, 90, 100, 100, 20);
  ctx.fill();

  ctx.font = 'bold 52px Arial';
  ctx.fillStyle = '#818cf8';
  ctx.textAlign = 'center';
  ctx.fillText('LA', 600, 160);

  // LinguaAI title
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#6366f1';
  ctx.textAlign = 'center';
  ctx.fillText('LinguaAI', 600, 220);

  // CERTIFICATE heading
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('С Е Р Т И Ф И К А Т   О Б   О К О Н Ч А Н И И   К У Р С А', 600, 265);

  // Gold divider
  ctx.fillStyle = accent;
  ctx.fillRect(200, 285, 800, 2);

  // "This certifies that"
  ctx.font = '20px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Настоящим удостоверяется, что', 600, 330);

  // Student name
  ctx.font = 'bold 52px Arial';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(data.studentName, 600, 400);

  // Underline name
  const nameWidth = ctx.measureText(data.studentName).width;
  ctx.fillStyle = 'rgba(99,102,241,0.5)';
  ctx.fillRect(600 - nameWidth / 2, 410, nameWidth, 2);

  // "successfully completed"
  ctx.font = '20px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('успешно завершил(а) курс', 600, 455);

  // Course name
  ctx.font = 'bold 34px Arial';
  ctx.fillStyle = '#818cf8';
  ctx.fillText(data.courseName, 600, 510);

  // Level & language
  const flag = LANG_FLAG[data.language] || '🌐';
  ctx.font = '18px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${flag} Уровень: ${data.level}`, 600, 550);

  // Score if provided
  if (data.score !== undefined) {
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Итоговый балл: ${data.score}%`, 600, 590);
  }

  // Bottom divider
  ctx.fillStyle = accent;
  ctx.fillRect(200, 620, 800, 2);

  // Date
  ctx.font = '16px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Дата выдачи: ${data.completedDate}`, 600, 660);

  // Seal
  ctx.beginPath();
  ctx.arc(600, 730, 55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(99,102,241,0.12)';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#818cf8';
  ctx.fillText('LINGUAAI', 600, 725);
  ctx.font = '11px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText('CERTIFIED', 600, 743);

  // Download
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${data.studentName.replace(/\s+/g, '-')}-${data.language}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
