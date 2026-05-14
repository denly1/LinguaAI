import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, Check, X, ArrowRight, Play, Trophy } from 'lucide-react';
import './Landing.css';

const TRIAL_WORDS = [
  { word: 'Apple', phonetic: '/ˈæpəl/', correct: 'Яблоко', options: ['Яблоко', 'Апельсин', 'Банан', 'Груша'] },
  { word: 'House', phonetic: '/haʊs/', correct: 'Дом', options: ['Машина', 'Дом', 'Школа', 'Парк'] },
  { word: 'Water', phonetic: '/ˈwɔːtər/', correct: 'Вода', options: ['Молоко', 'Сок', 'Вода', 'Чай'] },
  { word: 'Book', phonetic: '/bʊk/', correct: 'Книга', options: ['Тетрадь', 'Ручка', 'Книга', 'Стол'] },
  { word: 'Happy', phonetic: '/ˈhæpi/', correct: 'Счастливый', options: ['Грустный', 'Злой', 'Усталый', 'Счастливый'] },
];

const TrialWidget: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const word = TRIAL_WORDS[current];

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === word.correct;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= TRIAL_WORDS.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
      }
    }, 900);
  };

  if (done) {
    return (
      <div className="trial-word-card">
        <div className="trial-result">
          <div className="trial-result-emoji">{score >= 4 ? '🎉' : score >= 2 ? '👍' : '💪'}</div>
          <div className="trial-result-title">
            {score >= 4 ? 'Отлично!' : score >= 2 ? 'Хороший старт!' : 'Есть куда расти!'}
          </div>
          <div className="trial-result-sub">
            Правильных ответов: <strong>{score}</strong> из {TRIAL_WORDS.length}
          </div>
          <button className="btn-hero-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onFinish}>
            Зарегистрироваться и продолжить <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trial-word-card">
      <div className="trial-word-card-header">
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          Вопрос {current + 1} / {TRIAL_WORDS.length}
        </span>
        <div className="trial-progress-dots">
          {TRIAL_WORDS.map((_, i) => (
            <div
              key={i}
              className={`trial-dot ${i < current ? 'done' : i === current ? 'current' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="trial-word-big">{word.word}</div>
      <div className="trial-phonetic">{word.phonetic}</div>

      <div className="trial-options">
        {word.options.map(opt => {
          let cls = 'trial-option';
          if (selected) {
            if (opt === word.correct) cls += ' correct';
            else if (opt === selected) cls += ' wrong';
          }
          return (
            <button key={opt} className={cls} onClick={() => handleSelect(opt)} disabled={!!selected}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={`trial-feedback ${selected === word.correct ? 'correct-fb' : 'wrong-fb'}`}>
          {selected === word.correct ? '✓ Правильно!' : `✗ Правильный ответ: ${word.correct}`}
        </div>
      )}
    </div>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [trialStarted, setTrialStarted] = useState(false);

  const goToAuth = () => navigate('/auth');
  const features = [
    { icon: '🃏', title: 'Флеш-карточки', desc: 'Адаптивное интервальное повторение автоматически планирует повторение каждого слова в нужный момент.', color: 'rgba(99,102,241,0.12)' },
    { icon: '🎮', title: 'Игровые упражнения', desc: 'Сопоставление слов, режим Speed Round и другие игры делают обучение интересным и эффективным.', color: 'rgba(245,158,11,0.12)' },
    { icon: '📚', title: 'Личные словари', desc: 'Создавайте тематические словари, добавляйте слова с транскрипцией, примерами и тегами.', color: 'rgba(16,185,129,0.12)' },
    { icon: '💬', title: 'Тьютор', desc: 'Персональный помощник отвечает на вопросы о языке, объясняет правила и даёт советы.', color: 'rgba(59,130,246,0.12)' },
    { icon: '📊', title: 'Прогресс и аналитика', desc: 'Отслеживайте статистику, точность ответов, серии занятий и рост XP по каждому языку.', color: 'rgba(236,72,153,0.12)' },
    { icon: '🏆', title: 'Таблица лидеров', desc: 'Соревнуйтесь с другими учениками, занимайте высокие позиции и поддерживайте серию занятий.', color: 'rgba(239,68,68,0.12)' },
  ];

  const steps = [
    { num: '1', title: 'Попробуйте бесплатно', desc: 'Пройдите пробный урок прямо сейчас — без регистрации.' },
    { num: '2', title: 'Создайте аккаунт', desc: 'Регистрация занимает 30 секунд. Выберите язык обучения.' },
    { num: '3', title: 'Купите курс', desc: 'Выберите подходящий тариф: Стандарт, Медиум или Премиум.' },
    { num: '4', title: 'Учитесь каждый день', desc: 'Занимайтесь 15–20 минут в день и отслеживайте прогресс.' },
  ];

  const langs = [
    { flag: '🇬🇧', name: 'Английский' },
    { flag: '🇷', name: 'Французский' },
    { flag: '🇳', name: 'Китайский' },
  ];

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-nav-logo-icon"><Brain size={20} /></div>
          <span className="landing-nav-logo-text">LinguaAI</span>
        </div>
        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
            Как это работает
          </button>
          <button className="landing-nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            Возможности
          </button>
          <button className="landing-nav-link" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Тарифы
          </button>
          <button className="landing-nav-link" onClick={goToAuth}>Войти</button>
          <button className="landing-nav-cta" onClick={goToAuth}>Начать бесплатно</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="landing-hero">
          <div className="landing-hero-left">
            <div className="landing-hero-badge">
              <Zap size={13} /> Адаптивное обучение
            </div>
            <h1 className="landing-hero-title">
              Изучайте языки<br /><span>умно и эффективно</span>
            </h1>
            <p className="landing-hero-sub">
              Флеш-карточки с интервальным повторением, игры, словари и персональный тьютор — всё в одном месте. Учитесь в своём темпе.
            </p>
            <div className="landing-hero-actions">
              <button className="btn-hero-primary" onClick={goToAuth}>
                Начать бесплатно <ArrowRight size={16} />
              </button>
              <button className="btn-hero-secondary" onClick={() => document.getElementById('trial')?.scrollIntoView({ behavior: 'smooth' })}>
                <Play size={15} /> Пробный урок
              </button>
            </div>
            <div className="landing-hero-trust">
              <div className="landing-hero-trust-item"><Check size={13} color="#10b981" /> Без оплаты для старта</div>
              <div className="landing-hero-trust-item"><Check size={13} color="#10b981" /> 3 языка</div>
              <div className="landing-hero-trust-item"><Check size={13} color="#10b981" /> Работает в браузере</div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="hero-card-lang">🇬🇧 Английский · A2</div>
                <div className="hero-card-streak">🔥 7 дней</div>
              </div>
              <div className="hero-word-block">
                <div className="hero-word">Serendipity</div>
                <div className="hero-phonetic">/ˌserənˈdɪpɪti/</div>
                <div className="hero-translation">Счастливая случайность</div>
              </div>
              <div className="hero-progress-row">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Прогресс сегодня</span>
                <div className="hero-progress-bar"><div className="hero-progress-fill" /></div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>13/20</span>
              </div>
              <div className="hero-card-stats">
                <div className="hero-stat-mini">
                  <div className="hero-stat-mini-val">347</div>
                  <div className="hero-stat-mini-lbl">Слов</div>
                </div>
                <div className="hero-stat-mini">
                  <div className="hero-stat-mini-val">84%</div>
                  <div className="hero-stat-mini-lbl">Точность</div>
                </div>
                <div className="hero-stat-mini">
                  <div className="hero-stat-mini-val">1240</div>
                  <div className="hero-stat-mini-lbl">XP</div>
                </div>
              </div>
            </div>
            <div className="hero-float-badge badge-top">
              <Check size={14} color="#10b981" /> Слово усвоено!
            </div>
            <div className="hero-float-badge badge-bot">
              <Trophy size={14} color="#4a6cf7" /> #3 в таблице лидеров
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <div className="landing-social-proof">
        <div className="landing-social-inner">
          <div className="social-proof-item">
            <div className="social-proof-num">500+</div>
            <div>студентов уже учатся</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <div className="social-proof-item">
            <div className="social-proof-num">3</div>
            <div>языка доступно</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <div className="social-proof-item">
            <div className="social-proof-num">10 000+</div>
            <div>слов в базе</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <div className="social-proof-item">
            <div className="social-proof-num">AI</div>
            <div>адаптивное обучение</div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how">
        <div className="landing-section">
          <div className="landing-section-label">Как это работает</div>
          <h2 className="landing-section-title">Четыре шага к новому языку</h2>
          <p className="landing-section-sub">От пробного урока до свободного владения — весь путь в одном приложении.</p>
          <div className="landing-steps">
            {steps.map((step, i) => (
              <div className="landing-step" key={step.num}>
                <div className="landing-step-num">{step.num}</div>
                <div className="landing-step-title">{step.title}</div>
                <div className="landing-step-desc">{step.desc}</div>
                {i < steps.length - 1 && <div className="landing-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRIAL ── */}
      <section id="trial" className="landing-trial-section">
        <div className="landing-trial-inner">
          <div>
            <div className="trial-info-badge"><Play size={13} /> Бесплатный пробный урок</div>
            <h2 className="landing-section-title" style={{ marginBottom: 12 }}>
              Попробуйте прямо сейчас
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Пройдите 5 вопросов по английскому без регистрации. Убедитесь, что формат вам подходит, и только потом создавайте аккаунт.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {['Реальный формат флеш-карточек', 'Мгновенная обратная связь', 'Результат в конце урока'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                  <Check size={15} color="#10b981" /> {t}
                </div>
              ))}
            </div>
            {!trialStarted && (
              <button className="btn-hero-primary" onClick={() => setTrialStarted(true)}>
                <Play size={15} /> Начать пробный урок
              </button>
            )}
          </div>
          <div>
            {trialStarted ? (
              <TrialWidget onFinish={goToAuth} />
            ) : (
              <div className="trial-word-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5 вопросов по английскому</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Регистрация не нужна</div>
                <button className="btn-hero-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setTrialStarted(true)}>
                  <Play size={15} /> Начать
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features">
        <div className="landing-section">
          <div className="landing-section-label">Возможности</div>
          <h2 className="landing-section-title">Всё для изучения языка</h2>
          <p className="landing-section-sub">Инструменты, которые действительно помогают запомнить язык надолго.</p>
          <div className="landing-features-grid">
            {features.map(f => (
              <div className="landing-feature-card" key={f.title}>
                <div className="landing-feature-icon" style={{ background: f.color, fontSize: 22 }}>{f.icon}</div>
                <div className="landing-feature-title">{f.title}</div>
                <div className="landing-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ── */}
      <div style={{ background: 'var(--bg-subtle, var(--bg-card2))', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="landing-section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="landing-section-label">Языки</div>
          <h2 className="landing-section-title">8 языков в одном приложении</h2>
          <div className="landing-languages">
            {langs.map(l => (
              <div className="lang-pill" key={l.name}>
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                <span>{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" className="landing-pricing">
        <div className="landing-pricing-inner">
          <div className="landing-section-label">Тарифы</div>
          <h2 className="landing-section-title">Выберите подходящий план</h2>
          <p className="landing-section-sub" style={{ marginBottom: 0 }}>
            Начните с бесплатного пробного урока, а затем выберите курс по своим задачам.
          </p>

          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card">
              <div className="pricing-tier-label">Бесплатно</div>
              <div className="pricing-price">
                <span className="pricing-amount">0</span>
                <span className="pricing-currency">₽</span>
              </div>
              <div className="pricing-per">пробный доступ</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  [true, 'Пробный урок (5 слов)'],
                  [true, 'Просмотр курсов'],
                  [true, 'Регистрация аккаунта'],
                  [false, 'Флеш-карточки и словари'],
                  [false, 'Игры и упражнения'],
                  [false, 'Тьютор'],
                  [false, 'Прогресс и аналитика'],
                ].map(([inc, text]) => (
                  <li key={text as string} className={`pricing-feature-item${inc ? ' included' : ''}`}>
                    <span className="pricing-check">{inc ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}</span>
                    {text as string}
                  </li>
                ))}
              </ul>
              <button className="btn-pricing btn-pricing-outline" onClick={goToAuth}>
                Зарегистрироваться
              </button>
            </div>

            {/* Standard */}
            <div className="pricing-card popular">
              <div className="pricing-popular-badge">Популярный выбор</div>
              <div className="pricing-tier-label">Стандарт</div>
              <div className="pricing-price">
                <span className="pricing-amount">990</span>
                <span className="pricing-currency">₽</span>
              </div>
              <div className="pricing-per">единовременно за курс</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  [true, '500+ слов и 20 уроков'],
                  [true, 'Флеш-карточки с повторением'],
                  [true, 'Личные словари'],
                  [true, 'Базовые тесты'],
                  [true, 'Игры и упражнения'],
                  [true, 'Прогресс и статистика'],
                  [false, 'Тьютор и живые сессии'],
                ].map(([inc, text]) => (
                  <li key={text as string} className={`pricing-feature-item${inc ? ' included' : ''}`}>
                    <span className="pricing-check">{inc ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}</span>
                    {text as string}
                  </li>
                ))}
              </ul>
              <button className="btn-pricing btn-pricing-primary" onClick={goToAuth}>
                Купить курс
              </button>
            </div>

            {/* Premium */}
            <div className="pricing-card">
              <div className="pricing-tier-label">Премиум</div>
              <div className="pricing-price">
                <span className="pricing-amount">4990</span>
                <span className="pricing-currency">₽</span>
              </div>
              <div className="pricing-per">полный доступ</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  [true, '2500+ слов и 70+ уроков'],
                  [true, 'Флеш-карточки с повторением'],
                  [true, 'Личные словари'],
                  [true, 'Расширенные тесты'],
                  [true, 'Все игры и упражнения'],
                  [true, 'Тьютор (чат-помощник)'],
                  [true, 'Живые сессии + сертификат'],
                ].map(([inc, text]) => (
                  <li key={text as string} className={`pricing-feature-item${inc ? ' included' : ''}`}>
                    <span className="pricing-check">{inc ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}</span>
                    {text as string}
                  </li>
                ))}
              </ul>
              <button className="btn-pricing btn-pricing-outline" onClick={goToAuth}>
                Купить Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Готовы начать?</h2>
          <p className="landing-cta-sub">
            Пройдите пробный урок прямо сейчас — это бесплатно. Регистрация займёт меньше минуты.
          </p>
          <div className="landing-cta-actions">
            <button className="btn-hero-primary" onClick={goToAuth}>
              Начать бесплатно <ArrowRight size={16} />
            </button>
            <button className="btn-hero-secondary" onClick={() => document.getElementById('trial')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play size={15} /> Пробный урок
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="var(--brand, #4a6cf7)" />
            <span style={{ fontWeight: 600 }}>LinguaAI</span>
            <span style={{ marginLeft: 8 }}>© 2024</span>
          </div>
          <div className="landing-footer-links">
            <a href="#how">Как это работает</a>
            <a href="#features">Возможности</a>
            <a href="#pricing">Тарифы</a>
            <a href="/auth">Войти</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
