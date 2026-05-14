import React from 'react';
import { BarChart2, TrendingUp, Award, Calendar, Zap, BookOpen, Target, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../data/sampleData';
import './Progress.css';

const Progress: React.FC = () => {
  const { state } = useApp();
  const { user, flashcards, currentLanguage } = state;

  const langProgress = user?.learningLanguages.find(l => l.language === currentLanguage);
  const sessions = langProgress?.studySessions || [];

  const last7Sessions = sessions.slice(-7);
  const maxCards = Math.max(...last7Sessions.map(s => s.cardsStudied), 1);

  const totalCards = sessions.reduce((a, s) => a + s.cardsStudied, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correctAnswers, 0);
  const totalTime = sessions.reduce((a, s) => a + s.duration, 0);
  const totalXP = sessions.reduce((a, s) => a + s.xpEarned, 0);

  const cardsByStatus = {
    mastered: flashcards.filter(f => f.word.language === currentLanguage && f.status === 'mastered').length,
    review: flashcards.filter(f => f.word.language === currentLanguage && f.status === 'review').length,
    learning: flashcards.filter(f => f.word.language === currentLanguage && f.status === 'learning').length,
    new: flashcards.filter(f => f.word.language === currentLanguage && f.status === 'new').length,
  };

  const totalFlashcards = Object.values(cardsByStatus).reduce((a, b) => a + b, 0);

  const achievements = [
    { icon: '🔥', title: `Серия ${user?.streak} дней`, desc: 'Занимайтесь каждый день', achieved: (user?.streak || 0) >= 1 },
    { icon: '📚', title: 'Первые 50 слов', desc: 'Изучите 50 слов', achieved: (langProgress?.wordsLearned || 0) >= 50 },
    { icon: '⚡', title: '500 XP', desc: 'Наберите 500 очков', achieved: (langProgress?.xp || 0) >= 500 },
    { icon: '🎯', title: 'Точность 80%', desc: 'Достигните точности 80%', achieved: (langProgress?.accuracy || 0) >= 80 },
    { icon: '📖', title: '10 занятий', desc: 'Проведите 10 занятий', achieved: sessions.length >= 10 },
    { icon: '🏆', title: '1000 XP', desc: 'Наберите 1000 очков', achieved: (langProgress?.xp || 0) >= 1000 },
    { icon: '💎', title: '100 слов', desc: 'Изучите 100 слов', achieved: (langProgress?.wordsLearned || 0) >= 100 },
    { icon: '🌟', title: 'Серия 7 дней', desc: 'Занимайтесь 7 дней подряд', achieved: (user?.streak || 0) >= 7 },
  ];

  const levelInfo = {
    beginner: { label: 'A1 Начинающий', next: 'A2 Элементарный', xpNeeded: 500 },
    elementary: { label: 'A2 Элементарный', next: 'B1 Средний', xpNeeded: 1000 },
    intermediate: { label: 'B1 Средний', next: 'B2 Выше среднего', xpNeeded: 2000 },
    'upper-intermediate': { label: 'B2 Выше среднего', next: 'C1 Продвинутый', xpNeeded: 4000 },
    advanced: { label: 'C1 Продвинутый', next: 'Максимальный уровень', xpNeeded: 8000 },
  };

  const currentLevel = levelInfo[langProgress?.level || 'beginner'];
  const xpProgress = Math.min(100, ((langProgress?.xp || 0) / currentLevel.xpNeeded) * 100);

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date().getDay();
  const studiedDays = sessions
    .slice(-7)
    .map(s => new Date(s.date).getDay());

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Прогресс</h1>
        <div className="lang-badge">
          {LANGUAGE_FLAGS[currentLanguage]} {LANGUAGE_NAMES[currentLanguage]}
        </div>
      </div>

      <div className="progress-overview">
        <div className="ov-card">
          <div className="ov-icon xp"><Zap size={18} /></div>
          <div className="ov-val">{langProgress?.xp || 0}</div>
          <div className="ov-lbl">Всего XP</div>
        </div>
        <div className="ov-card">
          <div className="ov-icon words"><BookOpen size={18} /></div>
          <div className="ov-val">{langProgress?.wordsLearned || 0}</div>
          <div className="ov-lbl">Слов изучено</div>
        </div>
        <div className="ov-card">
          <div className="ov-icon accuracy"><Target size={18} /></div>
          <div className="ov-val">{langProgress?.accuracy || 0}%</div>
          <div className="ov-lbl">Точность</div>
        </div>
        <div className="ov-card">
          <div className="ov-icon sessions"><Calendar size={18} /></div>
          <div className="ov-val">{sessions.length}</div>
          <div className="ov-lbl">Занятий</div>
        </div>
        <div className="ov-card">
          <div className="ov-icon time"><BarChart2 size={18} /></div>
          <div className="ov-val">{totalTime}</div>
          <div className="ov-lbl">Минут</div>
        </div>
        <div className="ov-card">
          <div className="ov-icon streak"><TrendingUp size={18} /></div>
          <div className="ov-val">{user?.streak || 0}</div>
          <div className="ov-lbl">Дней подряд</div>
        </div>
      </div>

      <div className="progress-grid">
        <div className="progress-main">
          <div className="p-card">
            <div className="p-card-header">
              <h2><TrendingUp size={16} /> Активность (последние 7 занятий)</h2>
            </div>
            {last7Sessions.length === 0 ? (
              <div className="no-data">Нет данных о занятиях</div>
            ) : (
              <div className="chart-area">
                <div className="bar-chart">
                  {last7Sessions.map((s, i) => (
                    <div key={s.id} className="chart-col">
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar"
                          style={{ height: `${(s.cardsStudied / maxCards) * 120}px` }}
                          title={`${s.cardsStudied} карточек`}
                        />
                        <div
                          className="chart-bar correct"
                          style={{ height: `${(s.correctAnswers / maxCards) * 120}px` }}
                          title={`${s.correctAnswers} правильно`}
                        />
                      </div>
                      <div className="chart-label">{new Date(s.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</div>
                      <div className="chart-xp">+{s.xpEarned}</div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <div className="legend-item"><span className="leg-dot total" />Всего карточек</div>
                  <div className="legend-item"><span className="leg-dot correct" />Правильных</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-card">
            <div className="p-card-header">
              <h2><Calendar size={16} /> Активность по дням недели</h2>
            </div>
            <div className="week-activity">
              {days.map((day, i) => {
                const dayIdx = (i + 1) % 7;
                const active = studiedDays.includes(dayIdx);
                const isToday = dayIdx === today;
                return (
                  <div key={day} className={`day-dot ${active ? 'active' : ''} ${isToday ? 'today' : ''}`}>
                    <div className="day-circle" />
                    <span>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-header">
              <h2><BookOpen size={16} /> Состояние карточек</h2>
            </div>
            <div className="cards-breakdown">
              <div className="card-donut">
                <svg viewBox="0 0 100 100" className="donut-svg">
                  {totalFlashcards > 0 && (() => {
                    const data = [
                      { value: cardsByStatus.mastered, color: '#10b981' },
                      { value: cardsByStatus.review, color: '#6366f1' },
                      { value: cardsByStatus.learning, color: '#f59e0b' },
                      { value: cardsByStatus.new, color: '#64748b' },
                    ];
                    let offset = 0;
                    return data.map((d, i) => {
                      const pct = (d.value / totalFlashcards) * 100;
                      const el = (
                        <circle
                          key={i}
                          cx="50" cy="50" r="35"
                          fill="none"
                          stroke={d.color}
                          strokeWidth="14"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                  <text x="50" y="53" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontWeight="bold">
                    {totalFlashcards}
                  </text>
                </svg>
              </div>
              <div className="card-stats-list">
                <div className="cs-item">
                  <span className="cs-dot mastered" />
                  <span className="cs-lbl">Усвоено</span>
                  <span className="cs-val">{cardsByStatus.mastered}</span>
                  <span className="cs-pct">{totalFlashcards > 0 ? Math.round(cardsByStatus.mastered / totalFlashcards * 100) : 0}%</span>
                </div>
                <div className="cs-item">
                  <span className="cs-dot review" />
                  <span className="cs-lbl">На повторении</span>
                  <span className="cs-val">{cardsByStatus.review}</span>
                  <span className="cs-pct">{totalFlashcards > 0 ? Math.round(cardsByStatus.review / totalFlashcards * 100) : 0}%</span>
                </div>
                <div className="cs-item">
                  <span className="cs-dot learning" />
                  <span className="cs-lbl">Изучаются</span>
                  <span className="cs-val">{cardsByStatus.learning}</span>
                  <span className="cs-pct">{totalFlashcards > 0 ? Math.round(cardsByStatus.learning / totalFlashcards * 100) : 0}%</span>
                </div>
                <div className="cs-item">
                  <span className="cs-dot new" />
                  <span className="cs-lbl">Новые</span>
                  <span className="cs-val">{cardsByStatus.new}</span>
                  <span className="cs-pct">{totalFlashcards > 0 ? Math.round(cardsByStatus.new / totalFlashcards * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="progress-sidebar">
          <div className="p-card">
            <div className="p-card-header">
              <h2><Award size={16} /> Уровень</h2>
            </div>
            <div className="level-card">
              <div className="level-current">{currentLevel.label}</div>
              <div className="level-xp">{langProgress?.xp || 0} / {currentLevel.xpNeeded} XP</div>
              <div className="level-bar">
                <div className="level-fill" style={{ width: `${xpProgress}%` }} />
              </div>
              <div className="level-next">Следующий: {currentLevel.next}</div>
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-header">
              <h2><BarChart2 size={16} /> Итого</h2>
            </div>
            <div className="total-stats">
              <div className="ts-item">
                <span>Карточек изучено</span>
                <span className="ts-val">{totalCards}</span>
              </div>
              <div className="ts-item">
                <span>Правильных ответов</span>
                <span className="ts-val">{totalCorrect}</span>
              </div>
              <div className="ts-item">
                <span>Общее время</span>
                <span className="ts-val">{totalTime} мин</span>
              </div>
              <div className="ts-item">
                <span>XP заработано</span>
                <span className="ts-val">{totalXP}</span>
              </div>
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-header">
              <h2><CheckCircle size={16} /> Достижения</h2>
            </div>
            <div className="achievements-list">
              {achievements.map((ach, i) => (
                <div key={i} className={`achievement ${ach.achieved ? 'achieved' : 'locked'}`}>
                  <div className="ach-icon">{ach.icon}</div>
                  <div className="ach-info">
                    <div className="ach-title">{ach.title}</div>
                    <div className="ach-desc">{ach.desc}</div>
                  </div>
                  {ach.achieved && <CheckCircle size={14} color="#10b981" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
