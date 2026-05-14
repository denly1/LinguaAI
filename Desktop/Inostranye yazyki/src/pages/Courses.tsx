import React, { useState } from 'react';
import { BookOpen, Clock, Shield, X, Star, LogIn, Play, CheckCircle, MessageSquare, Award, ChevronRight, Download } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import { Course, CourseTier, TIER_CONFIG, LANGUAGE_NAMES } from '../types/courses';
import { LanguageCode, DifficultyLevel } from '../types/index';
import './Courses.css';
import { generateCertificate } from '../services/certificate';

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'A1 — Начинающий',
  elementary: 'A2 — Элементарный',
  intermediate: 'B1 — Средний',
  'upper-intermediate': 'B2 — Выше среднего',
  advanced: 'C1+ — Продвинутый',
};

const PAYMENT_METHODS = [
  { id: 'card', label: 'Банковская карта', icon: '💳' },
  { id: 'sbp', label: 'СБП', icon: '📱' },
  { id: 'invoice', label: 'Счёт на оплату', icon: '🧾' },
];

interface PaymentModalProps {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ course, onClose, onSuccess }) => {
  const { authState } = useAuth();
  const { purchaseCourse } = useCourses();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [method, setMethod] = useState('card');
  const [name, setName] = useState(authState.currentUser?.name || '');
  const [email, setEmail] = useState(authState.currentUser?.email || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const tierCfg = TIER_CONFIG[course.tier];

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Введите имя';
    if (!email.includes('@')) e.email = 'Неверный email';
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) e.card = 'Введите 16 цифр';
      if (expiry.length < 5) e.expiry = 'Формат ММ/ГГ';
      if (cvv.length < 3) e.cvv = '3 цифры';
    }
    if (method === 'sbp' && phone.replace(/\D/g, '').length < 10) e.phone = 'Введите номер телефона';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    // Исправление: безопасно получаем userId, для гостя используем email как идентификатор
    const userId = authState.currentUser?.id || `guest-${email}`;
    setLoading(true);
    setTimeout(() => {
      const lastFour = method === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : '****';
      purchaseCourse(course.id, course.tier, userId, name, email, lastFour, course.price);
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal" onClick={e => e.stopPropagation()}>
          <div className="payment-success">
            <div className="payment-success-icon">🎉</div>
            <h3>Оплата прошла успешно!</h3>
            <p>
              Курс <strong>«{course.title}»</strong> ({tierCfg.label}) уже доступен в разделе «Мои курсы».
              Письмо с деталями отправлено на <strong>{email}</strong>.
            </p>
            <button className="btn-pay" onClick={() => { onSuccess(); onClose(); }}>
              Отлично!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-modal-header">
          <div>
            <div className="payment-modal-title">Оформление покупки</div>
            <div className="payment-modal-subtitle">Безопасная оплата · Отмена в любое время</div>
          </div>
          <button className="payment-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="payment-modal-body">
          {/* Course summary */}
          <div className="payment-course-summary">
            <div className="payment-course-emoji">{course.emoji}</div>
            <div className="payment-course-info">
              <div className="payment-course-name">{course.title}</div>
              <div className="payment-course-tier" style={{ color: tierCfg.color }}>
                {tierCfg.emoji} {tierCfg.label} · {LANGUAGE_NAMES[course.language]}
              </div>
            </div>
            <div className="payment-course-price">{course.price.toLocaleString('ru-RU')} ₽</div>
          </div>

          {/* Personal info */}
          <div>
            <div className="payment-section-title">Личные данные</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="payment-fields-row">
                <div className="payment-field">
                  <label>Имя и фамилия *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" />
                  {errors.name && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.name}</span>}
                </div>
                <div className="payment-field">
                  <label>Email *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@mail.ru" type="email" />
                  {errors.email && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.email}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <div className="payment-section-title">Способ оплаты</div>
            <div className="payment-methods">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  className={`payment-method-btn${method === m.id ? ' active' : ''}`}
                  onClick={() => setMethod(m.id)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card fields */}
          {method === 'card' && (
            <div>
              <div className="payment-section-title">Данные карты</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="payment-field">
                  <label>Номер карты *</label>
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  {errors.card && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.card}</span>}
                </div>
                <div className="payment-card-row">
                  <div className="payment-field">
                    <label>Имя на карте</label>
                    <input placeholder="IVAN IVANOV" style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="payment-field">
                    <label>Срок *</label>
                    <input
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="ММ/ГГ"
                      maxLength={5}
                    />
                    {errors.expiry && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.expiry}</span>}
                  </div>
                  <div className="payment-field">
                    <label>CVV *</label>
                    <input
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="•••"
                      type="password"
                      maxLength={3}
                    />
                    {errors.cvv && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.cvv}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SBP fields */}
          {method === 'sbp' && (
            <div>
              <div className="payment-section-title">Система быстрых платежей</div>
              <div className="payment-field">
                <label>Номер телефона *</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (999) 999-99-99"
                  type="tel"
                />
                {errors.phone && <span style={{ color: '#f87171', fontSize: 11 }}>{errors.phone}</span>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                После нажатия «Оплатить» вы получите ссылку для оплаты через СБП в вашем банке.
              </p>
            </div>
          )}

          {method === 'invoice' && (
            <div>
              <div className="payment-section-title">Счёт на оплату</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                После отправки заявки менеджер сформирует счёт и пришлёт его на указанный email в течение 1 рабочего дня.
              </p>
            </div>
          )}

          {/* Total */}
          <div className="payment-total-row">
            <div>
              <div className="payment-total-label">Итого к оплате</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tierCfg.label} · {course.title}</div>
            </div>
            <div className="payment-total-amount">{course.price.toLocaleString('ru-RU')} ₽</div>
          </div>

          <button className="btn-pay" onClick={handlePay} disabled={loading}>
            {loading ? 'Обработка...' : `Оплатить ${course.price.toLocaleString('ru-RU')} ₽`}
          </button>

          <div className="payment-secure-note">
            <Shield size={12} />
            Защищённое соединение · Данные не сохраняются
          </div>
        </div>
      </div>
    </div>
  );
};

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; size?: number }> = ({ value, onChange, size = 18 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1,2,3,4,5].map(n => (
      <Star
        key={n}
        size={size}
        fill={n <= value ? '#f59e0b' : 'none'}
        stroke={n <= value ? '#f59e0b' : 'var(--text-muted)'}
        style={{ cursor: onChange ? 'pointer' : 'default' }}
        onClick={() => onChange?.(n)}
      />
    ))}
  </div>
);

const LoginPromptModal: React.FC<{ course: Course; onClose: () => void }> = ({ course, onClose }) => (
  <div className="payment-modal-overlay" onClick={onClose}>
    <div className="payment-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
      <div className="payment-modal-header">
        <div className="payment-modal-title">Войдите для покупки</div>
        <button className="payment-modal-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="payment-modal-body" style={{ textAlign: 'center', padding: '24px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>«{course.title}»</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Зарегистрируйтесь бесплатно, чтобы купить курс и начать обучение. После регистрации вы получите доступ ко всем функциям платформы.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="/auth" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', background: 'var(--primary)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            <LogIn size={15} /> Войти / Регистрация
          </a>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>
            Отмена
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          Уже есть аккаунт? <a href="/auth" style={{ color: 'var(--primary)' }}>Войти</a>
        </p>
      </div>
    </div>
  </div>
);

const COURSE_LESSONS: Record<string, { id: string; title: string; duration: string; type: 'video' | 'practice' | 'test' | 'speaking'; done?: boolean }[]> = {
  'course-en-standard': [
    { id: 'l1',  title: 'Введение: алфавит и произношение',     duration: '12 мин',  type: 'video' },
    { id: 'l2',  title: 'Базовые приветствия',                  duration: '15 мин',  type: 'practice' },
    { id: 'l3',  title: 'Числа 1–100',                          duration: '20 мин',  type: 'practice' },
    { id: 'l4',  title: 'Цвета и формы',                        duration: '14 мин',  type: 'video' },
    { id: 'l5',  title: 'Дни недели и месяцы',                  duration: '18 мин',  type: 'practice' },
    { id: 'l6',  title: 'Глагол to be — основы',                duration: '22 мин',  type: 'video' },
    { id: 'l7',  title: 'Моя семья: словарь',                   duration: '16 мин',  type: 'practice' },
    { id: 'l8',  title: 'В магазине: диалоги',                  duration: '25 мин',  type: 'speaking' },
    { id: 'l9',  title: 'Present Simple — теория',              duration: '20 мин',  type: 'video' },
    { id: 'l10', title: 'Present Simple — практика',            duration: '30 мин',  type: 'practice' },
    { id: 'l11', title: 'Тест: модуль 1',                       duration: '15 мин',  type: 'test' },
    { id: 'l12', title: 'Еда и напитки',                        duration: '18 мин',  type: 'video' },
    { id: 'l13', title: 'Заказ в ресторане',                    duration: '20 мин',  type: 'speaking' },
    { id: 'l14', title: 'Present Continuous — основы',          duration: '22 мин',  type: 'video' },
    { id: 'l15', title: 'Итоговый тест: модуль 2',              duration: '20 мин',  type: 'test' },
  ],
  'course-en-premium': [
    { id: 'l1',  title: 'Диагностика уровня',                   duration: '20 мин',  type: 'test' },
    { id: 'l2',  title: 'A1: Полный обзор грамматики',          duration: '35 мин',  type: 'video' },
    { id: 'l3',  title: 'A1: Тренировка словаря (500 слов)',    duration: '40 мин',  type: 'practice' },
    { id: 'l4',  title: 'A2: Времена глаголов',                 duration: '30 мин',  type: 'video' },
    { id: 'l5',  title: 'A2: Разговорная практика',             duration: '25 мин',  type: 'speaking' },
    { id: 'l6',  title: 'B1: Условные предложения',             duration: '28 мин',  type: 'video' },
    { id: 'l7',  title: 'B1: Деловая переписка',                duration: '35 мин',  type: 'practice' },
    { id: 'l8',  title: 'B2: Академическое письмо',             duration: '40 мин',  type: 'video' },
    { id: 'l9',  title: 'B2: Сложные конструкции',              duration: '38 мин',  type: 'practice' },
    { id: 'l10', title: 'Живая сессия с тьютором',              duration: '60 мин',  type: 'speaking' },
    { id: 'l11', title: 'Итоговый экзамен',                     duration: '45 мин',  type: 'test' },
  ],
  'course-de-standard': [
    { id: 'l1',  title: 'Произношение и алфавит',               duration: '15 мин',  type: 'video' },
    { id: 'l2',  title: 'Базовые фразы',                        duration: '18 мин',  type: 'practice' },
    { id: 'l3',  title: 'Артикли der/die/das',                  duration: '25 мин',  type: 'video' },
    { id: 'l4',  title: 'Числа и время',                        duration: '20 мин',  type: 'practice' },
    { id: 'l5',  title: 'Спряжение глаголов',                   duration: '22 мин',  type: 'video' },
    { id: 'l6',  title: 'Бытовая лексика (300 слов)',           duration: '30 мин',  type: 'practice' },
    { id: 'l7',  title: 'Диалог: знакомство',                   duration: '20 мин',  type: 'speaking' },
    { id: 'l8',  title: 'Тест: модуль 1',                       duration: '15 мин',  type: 'test' },
  ],
  'course-fr-medium': [
    { id: 'l1',  title: 'Французское произношение',             duration: '20 мин',  type: 'video' },
    { id: 'l2',  title: 'Subjonctif présent — теория',          duration: '30 мин',  type: 'video' },
    { id: 'l3',  title: 'Subjonctif — практика',                duration: '35 мин',  type: 'practice' },
    { id: 'l4',  title: 'Деловая переписка',                    duration: '28 мин',  type: 'practice' },
    { id: 'l5',  title: 'Культура и традиции Франции',          duration: '25 мин',  type: 'video' },
    { id: 'l6',  title: 'Разговорная практика: B1',             duration: '30 мин',  type: 'speaking' },
    { id: 'l7',  title: 'Тест: уровень B1',                     duration: '20 мин',  type: 'test' },
  ],
  'course-es-premium': [
    { id: 'l1',  title: 'Диагностика уровня',                   duration: '20 мин',  type: 'test' },
    { id: 'l2',  title: 'Испанский vs Латиноамериканский',      duration: '25 мин',  type: 'video' },
    { id: 'l3',  title: 'Грамматика: Subjuntivo',               duration: '35 мин',  type: 'video' },
    { id: 'l4',  title: 'Бизнес-испанский',                     duration: '30 мин',  type: 'practice' },
    { id: 'l5',  title: 'Туризм и путешествия',                 duration: '28 мин',  type: 'practice' },
    { id: 'l6',  title: 'Живая сессия с тьютором',              duration: '60 мин',  type: 'speaking' },
    { id: 'l7',  title: 'Итоговый экзамен',                     duration: '45 мин',  type: 'test' },
  ],
};

const LANG_LESSON_TEMPLATES: Record<string, { title: string; type: 'video'|'practice'|'test'|'speaking'; dur: string }[][]> = {
  en: [
    [
      { title: 'Введение: алфавит и произношение', type: 'video', dur: '12 мин' },
      { title: 'Базовые приветствия и знакомство', type: 'practice', dur: '15 мин' },
      { title: 'Числа 1–100', type: 'practice', dur: '18 мин' },
      { title: 'Глагол to be', type: 'video', dur: '20 мин' },
      { title: 'Моя семья', type: 'practice', dur: '16 мин' },
      { title: 'В магазине: диалоги', type: 'speaking', dur: '22 мин' },
      { title: 'Present Simple', type: 'video', dur: '20 мин' },
      { title: 'Present Simple — практика', type: 'practice', dur: '28 мин' },
      { title: 'Тест: модуль 1', type: 'test', dur: '15 мин' },
      { title: 'Еда и напитки', type: 'video', dur: '18 мин' },
      { title: 'Заказ в ресторане', type: 'speaking', dur: '20 мин' },
      { title: 'Итоговый тест', type: 'test', dur: '20 мин' },
    ],
    [
      { title: 'Времена глаголов: обзор', type: 'video', dur: '25 мин' },
      { title: 'Past Simple — теория и практика', type: 'practice', dur: '30 мин' },
      { title: 'Future Simple', type: 'video', dur: '22 мин' },
      { title: 'Условные предложения If', type: 'video', dur: '28 мин' },
      { title: 'Бизнес-лексика (500 слов)', type: 'practice', dur: '35 мин' },
      { title: 'Деловая переписка', type: 'practice', dur: '30 мин' },
      { title: 'Разговор: интервью', type: 'speaking', dur: '25 мин' },
      { title: 'Passive Voice', type: 'video', dur: '24 мин' },
      { title: 'Тест: уровень B1', type: 'test', dur: '20 мин' },
    ],
    [
      { title: 'Диагностика уровня', type: 'test', dur: '20 мин' },
      { title: 'Сложные времена: обзор', type: 'video', dur: '35 мин' },
      { title: 'Perfect Tenses', type: 'practice', dur: '40 мин' },
      { title: 'Akademisches Schreiben', type: 'practice', dur: '35 мин' },
      { title: 'Продвинутые идиомы', type: 'video', dur: '28 мин' },
      { title: 'Разговор: бизнес-встреча', type: 'speaking', dur: '30 мин' },
      { title: 'Академическое эссе', type: 'practice', dur: '40 мин' },
      { title: 'Живая сессия с тьютором', type: 'speaking', dur: '60 мин' },
      { title: 'Итоговый экзамен B2', type: 'test', dur: '45 мин' },
    ],
  ],
  de: [
    [
      { title: 'Произношение и алфавит', type: 'video', dur: '15 мин' },
      { title: 'Артикли der/die/das', type: 'video', dur: '22 мин' },
      { title: 'Числа и время', type: 'practice', dur: '18 мин' },
      { title: 'Спряжение глаголов', type: 'practice', dur: '25 мин' },
      { title: 'Бытовая лексика (300 слов)', type: 'practice', dur: '30 мин' },
      { title: 'Диалог: знакомство', type: 'speaking', dur: '20 мин' },
      { title: 'Тест: модуль 1', type: 'test', dur: '15 мин' },
    ],
  ],
  fr: [
    [
      { title: 'Французское произношение', type: 'video', dur: '20 мин' },
      { title: 'Артикли и существительные', type: 'practice', dur: '22 мин' },
      { title: 'Présent de l\'indicatif', type: 'video', dur: '25 мин' },
      { title: 'Базовая лексика (400 слов)', type: 'practice', dur: '30 мин' },
      { title: 'Разговор: кафе и магазин', type: 'speaking', dur: '22 мин' },
      { title: 'Тест: A2', type: 'test', dur: '15 мин' },
    ],
    [
      { title: 'Subjonctif présent — теория', type: 'video', dur: '30 мин' },
      { title: 'Subjonctif — практика', type: 'practice', dur: '35 мин' },
      { title: 'Деловая переписка', type: 'practice', dur: '28 мин' },
      { title: 'Культура и традиции Франции', type: 'video', dur: '25 мин' },
      { title: 'Разговорная практика: B1', type: 'speaking', dur: '30 мин' },
      { title: 'Тест: уровень B1', type: 'test', dur: '20 мин' },
    ],
  ],
  es: [
    [
      { title: 'Произношение испанского', type: 'video', dur: '15 мин' },
      { title: 'Глаголы ser/estar', type: 'video', dur: '22 мин' },
      { title: 'Базовая лексика (350 слов)', type: 'practice', dur: '28 мин' },
      { title: 'Разговор: в ресторане', type: 'speaking', dur: '20 мин' },
      { title: 'Тест: A1', type: 'test', dur: '15 мин' },
    ],
    [
      { title: 'Диагностика уровня', type: 'test', dur: '20 мин' },
      { title: 'Испанский vs Латиноамериканский', type: 'video', dur: '25 мин' },
      { title: 'Subjuntivo: теория', type: 'video', dur: '35 мин' },
      { title: 'Бизнес-испанский', type: 'practice', dur: '30 мин' },
      { title: 'Туризм и путешествия', type: 'practice', dur: '28 мин' },
      { title: 'Живая сессия с тьютором', type: 'speaking', dur: '60 мин' },
      { title: 'Итоговый экзамен', type: 'test', dur: '45 мин' },
    ],
  ],
  it: [
    [
      { title: 'Итальянское произношение', type: 'video', dur: '14 мин' },
      { title: 'Глагол essere/avere', type: 'video', dur: '20 мин' },
      { title: 'Числа, цвета, дни недели', type: 'practice', dur: '18 мин' },
      { title: 'Туристические фразы', type: 'practice', dur: '22 мин' },
      { title: 'Разговор: знакомство', type: 'speaking', dur: '18 мин' },
      { title: 'Тест: A1', type: 'test', dur: '12 мин' },
    ],
  ],
  zh: [
    [
      { title: 'Пиньинь и тоны', type: 'video', dur: '20 мин' },
      { title: 'Базовые иероглифы HSK1', type: 'practice', dur: '30 мин' },
      { title: 'Числа и время', type: 'practice', dur: '22 мин' },
      { title: 'Диалог: знакомство', type: 'speaking', dur: '20 мин' },
      { title: 'Иероглифы HSK2', type: 'practice', dur: '35 мин' },
      { title: 'Тест: HSK1-2', type: 'test', dur: '20 мин' },
    ],
  ],
};

const LEVEL_TIER_IDX: Record<string, number> = {
  beginner: 0, elementary: 0, intermediate: 1, 'upper-intermediate': 2, advanced: 1,
};

function generateLessons(course: Course) {
  const templates = LANG_LESSON_TEMPLATES[course.language];
  if (!templates) {
    return [
      { id: 'l1', title: 'Введение в курс', duration: '10 мин', type: 'video' as const },
      { id: 'l2', title: 'Основная лексика', duration: '20 мин', type: 'practice' as const },
      { id: 'l3', title: 'Разговорная практика', duration: '25 мин', type: 'speaking' as const },
      { id: 'l4', title: 'Проверочный тест', duration: '15 мин', type: 'test' as const },
    ];
  }
  const tierBonus = course.tier === 'premium' ? 2 : course.tier === 'medium' ? 1 : 0;
  const idx = Math.min((LEVEL_TIER_IDX[course.level] ?? 0) + tierBonus, templates.length - 1);
  const base = templates[Math.min(idx, templates.length - 1)];
  return base.map((t, i) => ({ id: `l${i + 1}`, title: t.title, duration: t.dur, type: t.type }));
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video:    <Play size={13} />,
  practice: <BookOpen size={13} />,
  test:     <Award size={13} />,
  speaking: <MessageSquare size={13} />,
};
const TYPE_LABELS: Record<string, string> = {
  video: 'Урок', practice: 'Практика', test: 'Тест', speaking: 'Разговор',
};

interface CourseViewModalProps { course: Course; onClose: () => void; }
const CourseViewModal: React.FC<CourseViewModalProps> = ({ course, onClose }) => {
  const { authState } = useAuth();
  const lessons = COURSE_LESSONS[course.id] || generateLessons(course);
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id);
  const [done, setDone] = useState<Set<string>>(new Set());
  const activeLesson = lessons.find(l => l.id === activeLessonId);
  const progress = Math.round((done.size / lessons.length) * 100);
  const allDone = done.size === lessons.length && lessons.length > 0;

  const handleCertificate = () => {
    generateCertificate({
      studentName: authState.currentUser?.name || 'Студент',
      courseName: course.title,
      language: course.language,
      level: LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] || course.level,
      completedDate: new Date().toLocaleDateString('ru-RU'),
      score: 92,
    });
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="course-view-modal" onClick={e => e.stopPropagation()}>
        <div className="cvm-header" style={{ borderTop: `4px solid ${course.coverColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{course.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{course.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {TIER_CONFIG[course.tier].emoji} {TIER_CONFIG[course.tier].label} · {done.size}/{lessons.length} уроков пройдено
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        <div className="cvm-progress-bar">
          <div className="cvm-progress-fill" style={{ width: `${progress}%`, background: course.coverColor }} />
        </div>

        <div className="cvm-body">
          <div className="cvm-lessons">
            <div className="cvm-lessons-title">Программа курса</div>
            {lessons.map((l, i) => (
              <div
                key={l.id}
                className={`cvm-lesson-item ${activeLessonId === l.id ? 'active' : ''} ${done.has(l.id) ? 'done' : ''}`}
                onClick={() => setActiveLessonId(l.id)}
              >
                <div className="cvm-lesson-num">
                  {done.has(l.id) ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <span>{i + 1}</span>}
                </div>
                <div className="cvm-lesson-info">
                  <div className="cvm-lesson-title">{l.title}</div>
                  <div className="cvm-lesson-meta">
                    <span className="cvm-lesson-type">{TYPE_ICONS[l.type]} {TYPE_LABELS[l.type]}</span>
                    <span>{l.duration}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="cvm-lesson-arrow" />
              </div>
            ))}
          </div>

          <div className="cvm-content">
            {activeLesson && (
              <>
                <div className="cvm-content-header">
                  <div className="cvm-content-type-badge">{TYPE_ICONS[activeLesson.type]} {TYPE_LABELS[activeLesson.type]}</div>
                  <h2 className="cvm-content-title">{activeLesson.title}</h2>
                  <div className="cvm-content-meta"><Clock size={13} /> {activeLesson.duration}</div>
                </div>

                <div className="cvm-content-body">
                  {activeLesson.type === 'video' && (
                    <div className="cvm-video-placeholder">
                      <div className="cvm-video-icon"><Play size={36} /></div>
                      <div className="cvm-video-label">Нажмите для просмотра урока</div>
                      <div className="cvm-video-sub">{activeLesson.duration} · HD видео с субтитрами</div>
                    </div>
                  )}
                  {activeLesson.type === 'practice' && (
                    <div className="cvm-practice-block">
                      <div className="cvm-practice-icon"><BookOpen size={32} /></div>
                      <div className="cvm-practice-title">Практическое задание</div>
                      <p className="cvm-practice-desc">Выполните упражнения по теме «{activeLesson.title}». Используйте карточки в разделе «Карточки» для закрепления новых слов.</p>
                      <div className="cvm-practice-steps">
                        <div className="cvm-step"><span>1</span> Прочитайте теорию</div>
                        <div className="cvm-step"><span>2</span> Повторите слова в карточках</div>
                        <div className="cvm-step"><span>3</span> Пройдите мини-тест</div>
                      </div>
                    </div>
                  )}
                  {activeLesson.type === 'speaking' && (
                    <div className="cvm-practice-block">
                      <div className="cvm-practice-icon"><MessageSquare size={32} /></div>
                      <div className="cvm-practice-title">Разговорная практика</div>
                      <p className="cvm-practice-desc">Отработайте диалоги с ИИ-тьютором. Перейдите в раздел «Тьютор» и попросите попрактиковаться по теме «{activeLesson.title}».</p>
                      <div className="cvm-practice-steps">
                        <div className="cvm-step"><span>1</span> Изучите образцы диалогов</div>
                        <div className="cvm-step"><span>2</span> Практика с ИИ-тьютором</div>
                        <div className="cvm-step"><span>3</span> Запись и самооценка</div>
                      </div>
                    </div>
                  )}
                  {activeLesson.type === 'test' && (
                    <div className="cvm-practice-block">
                      <div className="cvm-practice-icon"><Award size={32} /></div>
                      <div className="cvm-practice-title">Проверочный тест</div>
                      <p className="cvm-practice-desc">Пройдите тест для проверки знаний по пройденным урокам. Для сдачи необходимо набрать 70%.</p>
                      <div className="cvm-practice-steps">
                        <div className="cvm-step"><span>✓</span> Проходной балл: 70%</div>
                        <div className="cvm-step"><span>⏱</span> Время: {activeLesson.duration}</div>
                        <div className="cvm-step"><span>∞</span> Неограниченные попытки</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="cvm-actions">
                  {!done.has(activeLesson.id) ? (
                    <button
                      className="cvm-btn-start"
                      style={{ background: course.coverColor }}
                      onClick={() => {
                        setDone(prev => new Set(Array.from(prev).concat(activeLesson.id)));
                        const idx = lessons.findIndex(l => l.id === activeLesson.id);
                        if (idx < lessons.length - 1) setActiveLessonId(lessons[idx + 1].id);
                      }}
                    >
                      {activeLesson.type === 'video' ? 'Начать урок' :
                       activeLesson.type === 'test' ? 'Начать тест' :
                       activeLesson.type === 'speaking' ? 'Начать практику' : 'Начать задание'}
                    </button>
                  ) : (
                    <button className="cvm-btn-done" disabled>
                      <CheckCircle size={16} /> Выполнено
                    </button>
                  )}
                  {allDone && (
                    <button className="cvm-btn-cert" onClick={handleCertificate}>
                      <Download size={15} /> Скачать сертификат
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Courses: React.FC = () => {
  const { state, hasPurchased, getCourseReviews, addReview, canReview } = useCourses();
  const { authState, isGuest } = useAuth();
  const [filterLang, setFilterLang] = useState<'all' | LanguageCode>('all');
  const [filterTier, setFilterTier] = useState<'all' | CourseTier>('all');
  const [buyingCourse, setBuyingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [loginPromptCourse, setLoginPromptCourse] = useState<Course | null>(null);
  const [reviewCourse, setReviewCourse] = useState<Course | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const userId = authState.currentUser?.id || '';
  const myCourses = state.courses.filter(c => hasPurchased(userId, c.id));

  const publishedCourses = state.courses.filter(c => c.status === 'published');
  const filtered = publishedCourses.filter(c => {
    const langOk = filterLang === 'all' || c.language === filterLang;
    const tierOk = filterTier === 'all' || c.tier === filterTier;
    return langOk && tierOk;
  });

  const langs = Array.from(new Set(publishedCourses.map(c => c.language)));
  const totalStudents = publishedCourses.reduce((s, c) => s + c.totalStudents, 0);

  const getPurchaseStatus = (courseId: string) => {
    if (hasPurchased(userId, courseId)) return 'owned';
    return 'none';
  };

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1 className="courses-title">Курсы иностранных языков</h1>
        <p className="courses-subtitle">Выберите курс и начните обучение уже сегодня</p>
      </div>

      {/* Hero */}
      <div className="courses-hero">
        <div className="courses-hero-text">
          <h2>Профессиональные курсы языков</h2>
          <p>
            Курсы для всех уровней — от нуля до продвинутого.
            Флеш-карточки, тесты, игры и персональный тьютор для эффективного обучения.
          </p>
        </div>
        <div className="courses-hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{publishedCourses.length}</div>
            <div className="hero-stat-label">Курсов</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{langs.length}</div>
            <div className="hero-stat-label">Языков</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{totalStudents}+</div>
            <div className="hero-stat-label">Студентов</div>
          </div>
        </div>
      </div>

      {/* My courses */}
      {myCourses.length > 0 && (
        <div className="my-courses-section">
          <div className="section-label">📚 Мои курсы</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myCourses.map(c => (
              <div key={c.id} className="my-course-card">
                <div className="my-course-emoji">{c.emoji}</div>
                <div className="my-course-info">
                  <div className="my-course-title">{c.title}</div>
                  <div className="my-course-meta">{TIER_CONFIG[c.tier].label} · {LANGUAGE_NAMES[c.language]}</div>
                </div>
                <button className="btn-start-course" onClick={() => setViewingCourse(c)}>Продолжить →</button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Filters */}
      <div className="courses-filters">
        <button
          className={`courses-filter-btn${filterLang === 'all' ? ' active' : ''}`}
          onClick={() => setFilterLang('all')}
        >
          Все языки
        </button>
        {langs.map(l => (
          <button
            key={l}
            className={`courses-filter-btn${filterLang === l ? ' active' : ''}`}
            onClick={() => setFilterLang(l)}
          >
            {LANGUAGE_NAMES[l]}
          </button>
        ))}

        <div className="courses-filter-sep" />

        <button
          className={`courses-filter-btn${filterTier === 'all' ? ' active' : ''}`}
          onClick={() => setFilterTier('all')}
        >
          Все тарифы
        </button>
        {(['standard', 'medium', 'premium'] as CourseTier[]).map(t => (
          <button
            key={t}
            className={`courses-filter-btn${filterTier === t ? ' active' : ''}`}
            onClick={() => setFilterTier(t)}
            style={filterTier === t ? {} : { borderColor: TIER_CONFIG[t].color, color: TIER_CONFIG[t].color }}
          >
            {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="courses-grid">
        {filtered.map(course => {
          const tierCfg = TIER_CONFIG[course.tier];
          const pStatus = getPurchaseStatus(course.id);

          return (
            <div key={course.id} className="course-card">
              <div className="course-card-header" style={{ borderTop: `3px solid ${course.coverColor}` }}>
                <div className="course-card-top">
                  <span className="course-emoji">{course.emoji}</span>
                  <span
                    className="course-tier-badge"
                    style={{ color: tierCfg.color, background: tierCfg.bg, borderColor: tierCfg.color + '44' }}
                  >
                    {tierCfg.emoji} {tierCfg.label}
                  </span>
                </div>
                <div className="course-card-title">{course.title}</div>
                <div className="course-card-desc">{course.description}</div>
                <div className="course-card-meta">
                  <span className="course-meta-tag">
                    <BookOpen size={10} /> {LANGUAGE_NAMES[course.language]}
                  </span>
                  <span className="course-meta-tag">
                    {LEVEL_LABELS[course.level]}
                  </span>
                  {course.lessons.length > 0 && (
                    <span className="course-meta-tag">
                      <Clock size={10} /> {course.lessons.length} уроков
                    </span>
                  )}
                </div>
              </div>

              <div className="course-card-features">
                <ul className="course-features-list">
                  {course.features.slice(0, 5).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="course-card-footer">
                <div>
                  <div className="course-price">
                    <span className="course-price-amount">{course.price.toLocaleString('ru-RU')} ₽</span>
                    <span className="course-price-label">единовременно</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="course-rating">★ {course.rating}</span>
                    <span className="course-students">{course.totalStudents} студ.</span>
                  </div>
                </div>

                {pStatus === 'owned' ? (
                  <button className="btn-buy-course owned" disabled>✓ Куплен</button>
                ) : (
                  <button className="btn-buy-course" onClick={() => isGuest ? setLoginPromptCourse(course) : setBuyingCourse(course)}>
                    Купить
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Курсов не найдено</div>
          <div style={{ fontSize: 14 }}>Попробуйте изменить фильтры</div>
        </div>
      )}

      {/* Отзывы о купленных курсах */}
      {myCourses.length > 0 && (
        <div className="my-courses-section" style={{ marginTop: 32 }}>
          <div className="section-label">⭐ Отзывы о ваших курсах</div>
          {myCourses.map(course => {
            const reviews = getCourseReviews(course.id);
            const canLeaveReview = !isGuest && canReview(userId, course.id);
            return (
              <div key={course.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{course.emoji} {course.title}</span>
                  {canLeaveReview && (
                    <button
                      className="btn-start-course"
                      onClick={() => { setReviewCourse(course); setReviewRating(5); setReviewComment(''); }}
                    >
                      + Оставить отзыв
                    </button>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Отзывов пока нет. Будьте первым!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {r.userName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.userName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('ru-RU')}</div>
                          </div>
                          <div style={{ marginLeft: 'auto' }}>
                            <StarRating value={r.rating} size={14} />
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модал отзыва */}
      {reviewCourse && (
        <div className="payment-modal-overlay" onClick={() => setReviewCourse(null)}>
          <div className="payment-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="payment-modal-header">
              <div className="payment-modal-title">Оставить отзыв</div>
              <button className="payment-modal-close" onClick={() => setReviewCourse(null)}><X size={16} /></button>
            </div>
            <div className="payment-modal-body">
              <p style={{ margin: '0 0 12px', fontWeight: 600 }}>{reviewCourse.emoji} {reviewCourse.title}</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Ваша оценка</div>
                <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Комментарий *</div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Расскажите о вашем опыте с курсом..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                className="btn-pay"
                disabled={!reviewComment.trim()}
                onClick={() => {
                  if (!reviewComment.trim()) return;
                  addReview(reviewCourse.id, userId, authState.currentUser?.name || 'Пользователь', reviewRating, reviewComment.trim());
                  setReviewCourse(null);
                }}
              >
                Отправить отзыв
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCourse && (
        <CourseViewModal course={viewingCourse} onClose={() => setViewingCourse(null)} />
      )}

      {buyingCourse && (
        <PaymentModal
          course={buyingCourse}
          onClose={() => setBuyingCourse(null)}
          onSuccess={() => setBuyingCourse(null)}
        />
      )}

      {loginPromptCourse && (
        <LoginPromptModal
          course={loginPromptCourse}
          onClose={() => setLoginPromptCourse(null)}
        />
      )}
    </div>
  );
};

export default Courses;
