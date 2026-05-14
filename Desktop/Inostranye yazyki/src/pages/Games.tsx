import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Games.css';

const STUB = false;

const Games: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { flashcards, currentLanguage } = state;
  const cardCount = flashcards.filter(f => f.word.language === currentLanguage).length;

  if (STUB) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Игры</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, color: '#9ca3af', fontSize: 14 }}>
        Функция недоступна
      </div>
    </div>
  );

  const games = [
    {
      id: 'matching',
      title: 'Сопоставление',
      description: 'Соедините слова с переводами. Тренирует зрительную память.',
      icon: '🧩',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      path: '/games/matching',
      tags: ['Память', 'Визуальный'],
      minCards: 4,
    },
    {
      id: 'speed',
      title: 'Speed Round',
      description: 'Отвечайте быстро! Серии ответов дают бонусные очки.',
      icon: '⚡',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      path: '/games/speed',
      tags: ['Скорость', 'Реакция'],
      minCards: 4,
    },
    {
      id: 'flashcards',
      title: 'Карточки',
      description: 'Классический режим с адаптивным повторением.',
      icon: '🃏',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      path: '/flashcards',
      tags: ['Повторение', 'Адаптивное'],
      minCards: 1,
    },
    {
      id: 'quiz',
      title: 'Тест',
      description: 'Выберите правильный ответ из 4 вариантов.',
      icon: '🎯',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
      path: '/flashcards?mode=quiz',
      tags: ['Тест', 'Выбор'],
      minCards: 4,
    },
    {
      id: 'study',
      title: 'Изучение',
      description: 'Вводите переводы вручную — лучший метод запоминания.',
      icon: '✍️',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      path: '/flashcards?mode=study',
      tags: ['Ввод', 'Активный'],
      minCards: 1,
    },
    {
      id: 'tutor',
      title: 'Тьютор',
      description: 'Получите персональные советы и упражнения по языку.',
      icon: '🤖',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      path: '/ai-tutor',
      tags: ['Советы', 'Диалог'],
      minCards: 0,
    },
  ];

  return (
    <div className="games-page page-enter">
      <div className="games-header">
        <div>
          <h1><Gamepad2 size={24} /> Игры и упражнения</h1>
          <p className="games-subtitle">Выберите режим обучения · {cardCount} карточек доступно</p>
        </div>
        <div className="games-stats-row">
          <div className="gs-chip"><Trophy size={13} /> Карточек: {cardCount}</div>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game, i) => {
          const available = cardCount >= game.minCards;
          return (
            <div
              key={game.id}
              className={`game-card ${!available ? 'disabled' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => available && navigate(game.path)}
            >
              <div className="game-card-top">
                <div className="game-icon" style={{ background: game.bg, fontSize: 36 }}>{game.icon}</div>
                <div className="game-tags">
                  {game.tags.map(t => (
                    <span key={t} className="game-tag" style={{ color: game.color, background: game.bg }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="game-title" style={{ color: available ? game.color : 'var(--text-muted)' }}>{game.title}</div>
              <div className="game-desc">{game.description}</div>
              {!available && (
                <div className="game-locked">Нужно минимум {game.minCards} карточек</div>
              )}
              <div className="game-arrow" style={{ color: game.color }}>→</div>
              <div className="game-card-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${game.bg}, transparent 70%)` }} />
            </div>
          );
        })}
      </div>

      <div className="games-tips">
        <div className="games-tips-header"><Star size={14} /> Советы по эффективному обучению</div>
        <div className="tips-grid">
          {[
            ['⏰', '20-30 минут', 'Занимайтесь каждый день по 20-30 минут — это лучше, чем 3 часа раз в неделю'],
            ['🔄', 'Интервалы', 'Адаптивное повторение автоматически напомнит повторить слово в нужный момент'],
            ['⚡', 'Speed Round', 'Скоростные упражнения тренируют автоматическое узнавание слов'],
            ['🧩', 'Сопоставление', 'Визуальные связи укрепляют долгосрочную память'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="tip-item">
              <span className="tip-icon">{icon}</span>
              <div>
                <div className="tip-title">{title}</div>
                <div className="tip-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
