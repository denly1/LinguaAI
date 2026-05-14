import React, { useState } from 'react';
import { Trophy, Zap, Flame, Crown, Medal, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

type Period = 'week' | 'month' | 'all';

const AVATARS = ['🧑‍💻','👩‍🎓','🧑‍🎨','👨‍🏫','👩‍🔬','🧑‍💼','👩‍🚀','🧑‍🍳'];

const STUB = false;

const Leaderboard: React.FC = () => {
  const { authState } = useAuth();
  const [period, setPeriod] = useState<Period>('all');

  if (STUB) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Таблица лидеров</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, color: '#9ca3af', fontSize: 14 }}>
        Функция недоступна
      </div>
    </div>
  );

  const sorted = [...authState.users]
    .filter(u => u.isActive)
    .sort((a, b) => {
      if (period === 'week') return b.streak - a.streak;
      if (period === 'month') return (b.totalXP * 0.4 + b.streak * 60) - (a.totalXP * 0.4 + a.streak * 60);
      return b.totalXP - a.totalXP;
    });

  const currentUserId = authState.currentUser?.id;

  const RANK_ICONS = [
    <Crown size={18} color="#fbbf24" />,
    <Medal size={18} color="#94a3b8" />,
    <Medal size={18} color="#b45309" />,
  ];

  const RANK_CLASSES = ['gold', 'silver', 'bronze'];

  return (
    <div className="leaderboard-page page-enter">
      <div className="lb-header">
        <div>
          <h1><Trophy size={22} /> Таблица лидеров</h1>
          <p className="lb-subtitle">Соревнуйтесь с другими учениками</p>
        </div>
        <div className="lb-period-tabs">
          {([['week','За неделю'],['month','За месяц'],['all','Всё время']] as [Period,string][]).map(([p,label]) => (
            <button key={p} className={`lb-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length >= 3 && (
        <div className="lb-podium">
          {[sorted[1], sorted[0], sorted[2]].map((user, podiumIdx) => {
            const actualRank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
            const rank = actualRank;
            const heights = ['120px', '150px', '90px'];
            return (
              <div key={user.id} className={`podium-slot rank-${rank + 1} ${user.id === currentUserId ? 'is-me' : ''}`}>
                <div className="podium-avatar">
                  {AVATARS[Math.abs(user.id.charCodeAt(0)) % AVATARS.length]}
                  <div className="podium-rank-badge">{RANK_ICONS[rank]}</div>
                </div>
                <div className="podium-name">{user.name}</div>
                <div className="podium-xp"><Zap size={12} /> {user.totalXP.toLocaleString()} XP</div>
                <div className={`podium-stand ${RANK_CLASSES[rank]}`} style={{ height: heights[podiumIdx] }}>
                  <span className="podium-number">#{rank + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="lb-list">
        <div className="lb-list-header">
          <span>#</span>
          <span>Участник</span>
          <span>XP</span>
          <span>Серия</span>
          <span>Уровень</span>
          <span>Прогресс</span>
        </div>
        {sorted.map((user, idx) => {
          const isMe = user.id === currentUserId;
          const maxXP = sorted[0]?.totalXP || 1;
          const pct = Math.round((user.totalXP / maxXP) * 100);
          const levels = ['🌱','📗','📘','📙','🏆'];
          const levelIdx = Math.min(4, Math.floor(user.totalXP / 3000));

          return (
            <div key={user.id} className={`lb-row ${isMe ? 'lb-row-me' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="lb-rank">
                {idx < 3 ? RANK_ICONS[idx] : <span className="rank-num">{idx + 1}</span>}
              </div>
              <div className="lb-user">
                <div className="lb-avatar">
                  {AVATARS[Math.abs(user.id.charCodeAt(0)) % AVATARS.length]}
                </div>
                <div>
                  <div className="lb-name">{user.name} {isMe && <span className="you-badge">Вы</span>}</div>
                  <div className="lb-email">{user.email}</div>
                </div>
              </div>
              <div className="lb-xp">
                <Zap size={13} color="#fbbf24" />
                {user.totalXP.toLocaleString()}
              </div>
              <div className="lb-streak">
                <Flame size={13} color="#f87171" />
                {user.streak}
              </div>
              <div className="lb-level">{levels[levelIdx]}</div>
              <div className="lb-progress">
                <div className="lb-progress-bar">
                  <div className="lb-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="lb-pct">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserId && (() => {
        const myRank = sorted.findIndex(u => u.id === currentUserId) + 1;
        if (myRank === 0) return null;
        return (
          <div className="lb-my-rank">
            <TrendingUp size={16} />
            <span>Ваше место: <strong>#{myRank}</strong> из {sorted.length} участников</span>
            {myRank > 1 && (
              <span className="lb-gap">
                До #{myRank - 1}: <strong className="gap-xp">
                  +{(sorted[myRank - 2].totalXP - (authState.currentUser?.totalXP || 0)).toLocaleString()} XP
                </strong>
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default Leaderboard;
