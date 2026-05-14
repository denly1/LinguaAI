import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, TrendingUp, CreditCard, Clock, Brain, Star, Trophy, Target, ArrowRight, RotateCcw, Shield, Users, AlertTriangle, Crown, GraduationCap, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../data/sampleData';
import { getAIRecommendations, generateAITip, getSmartDailyGoal } from '../services/aiService';
import './Dashboard.css';

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Добро пожаловать в LinguaAI 👋</h1>
          <p className="dashboard-subtitle">Эффективное изучение языков с адаптивным подбором контента</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(74,108,247,0.12) 0%, rgba(107,137,255,0.06) 100%)', border: '1px solid rgba(74,108,247,0.2)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Начните обучение</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Выберите курс и получите доступ к карточкам, словарям, играм и тьютору.
          </p>
          <button
            onClick={() => navigate('/courses')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--brand, #4a6cf7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            <GraduationCap size={16} /> Смотреть курсы <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎮</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Пробный урок</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Попробуйте формат обучения прямо сейчас — без регистрации и оплаты.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--bg-subtle, var(--bg-card2))', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <Play size={15} /> Попробовать
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Что включено в обучение</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: '🇦', title: '8 языков', desc: 'EN, DE, FR, ES, IT, ZH, JA, PT' },
            { icon: '🎦', title: 'Флеш-карточки', desc: 'Алгоритм интервального повторения SM-2' },
            { icon: '🎮', title: 'Игры', desc: 'Сопоставление слов и Speed Round' },
            { icon: '📚', title: 'Словари', desc: 'Личные тематические словари' },
            { icon: '📊', title: 'Прогресс', desc: 'Статистика и аналитика обучения' },
            { icon: '🏆', title: 'Лидерборд', desc: 'Соревнование с другими учениками' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { authState, isManager, isAdmin, isGuest } = useAuth();
  const { getUserPurchases, hasPurchased, state: coursesState } = useCourses();
  const { user, flashcards, dictionaries, currentLanguage } = state;
  const navigate = useNavigate();
  const [aiTip, setAiTip] = useState('');
  const [tipVisible, setTipVisible] = useState(false);
  const [streakAnim, setStreakAnim] = useState(false);

  const langProgress = user?.learningLanguages.find(l => l.language === currentLanguage);
  const weekSessions = langProgress?.studySessions.slice(-7) || [];
  const weeklyXP = weekSessions.reduce((a, s) => a + s.xpEarned, 0);

  useEffect(() => {
    if (isGuest) return;
    const tip = generateAITip(currentLanguage);
    setAiTip(tip);
    setTimeout(() => setTipVisible(true), 300);
  }, [currentLanguage, isGuest]);

  useEffect(() => {
    if (isGuest || !user || user.streak === 0) return;
    setStreakAnim(true);
    const t = setTimeout(() => setStreakAnim(false), 600);
    return () => clearTimeout(t);
  }, [user, isGuest]);

  const xpToNextLevel = 500;
  const xpProgress = langProgress ? Math.min(100, (langProgress.xp % xpToNextLevel) / xpToNextLevel * 100) : 0;
  const wordsCount = useCountUp(isGuest ? 0 : (langProgress?.wordsLearned || 0));
  const accuracyCount = useCountUp(isGuest ? 0 : (langProgress?.accuracy || 0));
  const weeklyXPCount = useCountUp(isGuest ? 0 : weeklyXP);

  if (isGuest) return <GuestDashboard />;

  const recommendations = user ? getAIRecommendations(user, flashcards) : [];
  const dailyGoal = user?.dailyGoal ?? (user ? getSmartDailyGoal(user) : 10);

  const dueCards = flashcards.filter(f =>
    f.word.language === currentLanguage && new Date(f.nextReviewDate) <= new Date()
  );
  const masteredCards = flashcards.filter(f => f.word.language === currentLanguage && f.status === 'mastered');
  const todaySession = langProgress?.studySessions.find(
    s => s.date === new Date().toISOString().split('T')[0]
  );

  const levelLabels: Record<string, string> = {
    beginner: 'Начинающий',
    elementary: 'Элементарный',
    intermediate: 'Средний',
    'upper-intermediate': 'Выше среднего',
    advanced: 'Продвинутый',
  };

  const userId = authState.currentUser?.id || '';
  const myCourses = coursesState.courses.filter(c => hasPurchased(userId, c.id));
  const pendingPurchases = getUserPurchases(userId).filter(p => p.status === 'pending');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Привет, {user?.name}! 👋
          </h1>
          <p className="dashboard-subtitle">
            {LANGUAGE_FLAGS[currentLanguage]} Изучаете {LANGUAGE_NAMES[currentLanguage]} · Уровень: {levelLabels[langProgress?.level || 'beginner']}
          </p>
        </div>
        <div className={`streak-badge ${streakAnim ? 'animated' : ''}`} onClick={() => navigate('/leaderboard')}>
          <span className="streak-fire">🔥</span>
          <div>
            <div className="streak-count">{user?.streak}</div>
            <div className="streak-label">дней подряд</div>
          </div>
        </div>
      </div>

      <div className="ai-quick-ask" onClick={() => navigate('/ai-tutor')}>
        <div className="ai-quick-icon"><Brain size={20} /></div>
        <div className="ai-quick-text">
          <div className="ai-quick-title">Спросите AI</div>
          <div className="ai-quick-sub">Перевод, грамматика, диалоги — мгновенный ответ</div>
        </div>
        <ArrowRight size={18} className="ai-quick-arrow" />
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/progress')}
>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <Zap size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{langProgress?.xp || 0}</div>
            <div className="stat-label">XP набрано</div>
          </div>
          <div className="stat-glow" style={{ background: 'rgba(99,102,241,0.08)' }} />
        </div>
        <div className="stat-card" onClick={() => navigate('/flashcards')}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{wordsCount}</div>
            <div className="stat-label">Слов изучено</div>
          </div>
          <div className="stat-glow" style={{ background: 'rgba(16,185,129,0.08)' }} />
        </div>
        <div className="stat-card" onClick={() => navigate('/progress')}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
            <Trophy size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{accuracyCount}%</div>
            <div className="stat-label">Точность</div>
          </div>
          <div className="stat-glow" style={{ background: 'rgba(245,158,11,0.08)' }} />
        </div>
        <div className="stat-card" onClick={() => navigate('/leaderboard')}>
          <div className="stat-icon" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{weeklyXPCount}</div>
            <div className="stat-label">XP за неделю</div>
          </div>
          <div className="stat-glow" style={{ background: 'rgba(236,72,153,0.08)' }} />
        </div>
      </div>

      {/* My purchased courses */}
      {myCourses.length > 0 && (
        <div className="dashboard-my-courses card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2><GraduationCap size={18} /> Мои курсы</h2>
            <button className="card-action" onClick={() => navigate('/courses')}>Все курсы</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {myCourses.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-subtle, var(--bg-card2))', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', flex: '1 1 260px', cursor: 'pointer' }} onClick={() => navigate('/flashcards')}>
                <span style={{ fontSize: 28 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.tier === 'premium' ? '⭐ Premium' : c.tier === 'medium' ? '📗 Medium' : '📘 Standard'}</div>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--brand, #4a6cf7)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Play size={12} /> Учиться
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No courses yet — show prompt */}
      {myCourses.length === 0 && pendingPurchases.length === 0 && (
        <div style={{ background: 'linear-gradient(135deg, rgba(74,108,247,0.08) 0%, rgba(107,137,255,0.04) 100%)', border: '1px dashed rgba(74,108,247,0.3)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📚 У вас пока нет купленных курсов</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Купите курс, чтобы разблокировать карточки, словари, игры и тьютор.</div>
          </div>
          <button onClick={() => navigate('/courses')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--brand, #4a6cf7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <GraduationCap size={15} /> Выбрать курс <ArrowRight size={13} />
          </button>
        </div>
      )}

      {pendingPurchases.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Ожидает подтверждения: {pendingPurchases.length} покупка</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Менеджер подтвердит оплату в течение 24 часов. Курс откроется автоматически.</div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="today-progress card">
            <div className="card-header">
              <h2><Target size={18} /> Цель на сегодня</h2>
            </div>
            <div className="today-stats">
              <div className="today-done">{todaySession?.cardsStudied || 0}</div>
              <div className="today-sep">/</div>
              <div className="today-goal">{dailyGoal}</div>
              <div className="today-label">карточек</div>
            </div>
            <div className="today-bar">
              <div
                className="today-fill"
                style={{ width: `${Math.min(100, ((todaySession?.cardsStudied || 0) / dailyGoal) * 100)}%` }}
              />
            </div>
            <div className="today-actions">
              {dueCards.length > 0 && (
                <button className="btn-primary" onClick={() => navigate('/flashcards')}>
                  <CreditCard size={16} />
                  Повторить {dueCards.length} карточек <ArrowRight size={14} />
                </button>
              )}
              <button className="btn-secondary" onClick={() => navigate('/dictionaries')}>
                <BookOpen size={16} /> Открыть словари
              </button>
            </div>
          </div>

          <div className="week-chart card">
            <div className="card-header">
              <h2><TrendingUp size={18} /> Активность за неделю</h2>
            </div>
            <div className="week-bars">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => {
                const session = weekSessions[i];
                const height = session ? Math.max(8, (session.cardsStudied / 30) * 80) : 4;
                const isToday = i === new Date().getDay() - 1;
                return (
                  <div key={day} className="week-bar-wrap">
                    <div
                      className={`week-bar ${isToday ? 'today' : ''}`}
                      style={{ height: `${height}px` }}
                      title={session ? `${session.cardsStudied} карточек, ${session.xpEarned} XP` : 'Нет данных'}
                    />
                    <span className="week-day">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="languages-section card">
            <div className="card-header">
              <h2><BookOpen size={18} /> Мои языки</h2>
              <button className="card-action" onClick={() => navigate('/settings')}>Добавить</button>
            </div>
            <div className="language-list">
              {user?.learningLanguages.map(l => (
                <div key={l.language} className={`lang-item ${l.language === currentLanguage ? 'active' : ''}`}>
                  <div className="lang-flag">{LANGUAGE_FLAGS[l.language]}</div>
                  <div className="lang-details">
                    <div className="lang-name">{LANGUAGE_NAMES[l.language]}</div>
                    <div className="lang-progress-bar">
                      <div className="lang-fill" style={{ width: `${l.language === currentLanguage ? xpProgress : (l.xp % 500) / 5}%` }} />
                    </div>
                  </div>
                  <div className="lang-xp">{l.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className={`ai-tip-card card ${tipVisible ? 'visible' : ''}`}>
            <div className="ai-tip-header">
              <Brain size={16} />
              <span>Совет дня</span>
            </div>
            <p className="ai-tip-text">{aiTip}</p>
            <button
              className="ai-tip-refresh"
              onClick={() => setAiTip(generateAITip(currentLanguage))}
            >
              Другой совет
            </button>
          </div>

          <div className="recommendations card">
            <div className="card-header">
              <h2><Star size={18} /> Рекомендации</h2>
            </div>
            <div className="rec-list">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className={`rec-item type-${rec.type}`}>
                  <div className="rec-icon">
                    {rec.type === 'exercise' ? <CreditCard size={14} /> :
                     rec.type === 'tip' ? <Brain size={14} /> :
                     rec.type === 'review' ? <RotateCcw size={14} /> :
                     <Target size={14} />}
                  </div>
                  <div className="rec-content">
                    <div className="rec-title">{rec.title}</div>
                    <div className="rec-desc">{rec.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="quick-stats card">
            <div className="card-header">
              <h2><CreditCard size={18} /> Карточки</h2>
            </div>
            <div className="quick-stat-list">
              <div className="quick-stat">
                <span className="qs-dot new" />
                <span className="qs-label">Новые</span>
                <span className="qs-count">{flashcards.filter(f => f.status === 'new' && f.word.language === currentLanguage).length}</span>
              </div>
              <div className="quick-stat">
                <span className="qs-dot learning" />
                <span className="qs-label">Изучаются</span>
                <span className="qs-count">{flashcards.filter(f => f.status === 'learning' && f.word.language === currentLanguage).length}</span>
              </div>
              <div className="quick-stat">
                <span className="qs-dot review" />
                <span className="qs-label">На повторении</span>
                <span className="qs-count">{dueCards.length}</span>
              </div>
              <div className="quick-stat">
                <span className="qs-dot mastered" />
                <span className="qs-label">Усвоено</span>
                <span className="qs-count">{masteredCards.length}</span>
              </div>
            </div>
          </div>

          <div className="dict-stats card">
            <div className="card-header">
              <h2><Clock size={18} /> Словари</h2>
              <button className="card-action" onClick={() => navigate('/dictionaries')}>Все</button>
            </div>
            {dictionaries.filter(d => d.language === currentLanguage).slice(0, 3).map(d => (
              <div key={d.id} className="dict-mini" onClick={() => navigate('/dictionaries')}>
                <div className="dict-mini-dot" style={{ background: d.coverColor }} />
                <div className="dict-mini-name">{d.name}</div>
                <div className="dict-mini-count">{d.words.length} сл.</div>
              </div>
            ))}
          </div>

          {isManager && (
            <div className="admin-widget card">
              <div className="card-header">
                <h2>
                  {isAdmin ? <Crown size={16} /> : <Shield size={16} />}
                  {isAdmin ? 'Администратор' : 'Менеджер'}
                </h2>
                <button className="card-action" onClick={() => navigate('/admin')}>Панель</button>
              </div>
              <div className="admin-widget-stats">
                <div className="aw-stat">
                  <Users size={14} />
                  <span>{authState.users.length} пользователей</span>
                </div>
                <div className="aw-stat">
                  <span className="aw-dot active" />
                  <span>{authState.users.filter(u => u.isActive).length} активных</span>
                </div>
                {authState.users.filter(u => !u.isActive).length > 0 && (
                  <div className="aw-stat warn">
                    <AlertTriangle size={13} />
                    <span>{authState.users.filter(u => !u.isActive).length} заблокировано</span>
                  </div>
                )}
              </div>
              <div className="aw-top">
                <div className="aw-top-label">Топ-3 по XP:</div>
                {[...authState.users].sort((a, b) => b.totalXP - a.totalXP).slice(0, 3).map((u, i) => (
                  <div key={u.id} className="aw-top-user">
                    <span className="aw-rank">#{i + 1}</span>
                    <span className="aw-name">{u.name}</span>
                    <span className="aw-xp">{u.totalXP.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
