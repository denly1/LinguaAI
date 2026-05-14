import React, { useState, useEffect } from 'react';
import { Brain, TrendingDown, AlertCircle, CheckCircle, Zap, RefreshCw, Target, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './ErrorAnalysis.css';

interface ErrorEntry {
  id: string;
  word: string;
  translation: string;
  language: string;
  errorType: 'spelling' | 'grammar' | 'vocabulary' | 'translation';
  count: number;
  lastSeen: string;
  difficulty: number;
}

interface WeakTopic {
  topic: string;
  errorRate: number;
  totalAttempts: number;
  recommendation: string;
  icon: string;
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  spelling: 'Правописание',
  grammar: 'Грамматика',
  vocabulary: 'Словарный запас',
  translation: 'Перевод',
};

const ERROR_TYPE_COLORS: Record<string, string> = {
  spelling: '#f59e0b',
  grammar: '#ef4444',
  vocabulary: '#8b5cf6',
  translation: '#3b82f6',
};

function buildErrorsFromDictionaries(dictionaries: any[]): ErrorEntry[] {
  const errors: ErrorEntry[] = [];
  dictionaries.forEach(dict => {
    dict.words.forEach((word: any) => {
      if (word.sm2 && word.sm2.easeFactor < 2.0) {
        errors.push({
          id: word.id,
          word: word.term,
          translation: word.translation,
          language: dict.language,
          errorType: word.sm2.easeFactor < 1.4 ? 'vocabulary' : 'translation',
          count: Math.max(1, Math.round((2.5 - word.sm2.easeFactor) * 5)),
          lastSeen: word.sm2.nextReview || new Date().toISOString(),
          difficulty: Math.round((2.5 - word.sm2.easeFactor) * 40),
        });
      }
    });
  });
  return errors.sort((a, b) => b.count - a.count).slice(0, 30);
}

function buildWeakTopics(errors: ErrorEntry[]): WeakTopic[] {
  const typeGroups: Record<string, number[]> = {};
  errors.forEach(e => {
    if (!typeGroups[e.errorType]) typeGroups[e.errorType] = [];
    typeGroups[e.errorType].push(e.count);
  });

  const topics: WeakTopic[] = [];
  const recs: Record<string, string> = {
    vocabulary: 'Используйте карточки и игру "Speed Round" для тренировки новых слов',
    grammar: 'Пройдите грамматические упражнения в разделе курсов',
    spelling: 'Включите режим "Написание" в карточках для отработки правописания',
    translation: 'Практикуйте перевод с ИИ-тьютором в диалоговом режиме',
  };
  const icons: Record<string, string> = {
    vocabulary: '📚', grammar: '📝', spelling: '✏️', translation: '🔄',
  };

  Object.entries(typeGroups).forEach(([type, counts]) => {
    const total = counts.length;
    const sumErrors = counts.reduce((a, b) => a + b, 0);
    topics.push({
      topic: ERROR_TYPE_LABELS[type] || type,
      errorRate: Math.min(100, Math.round((sumErrors / (total * 5)) * 100)),
      totalAttempts: total,
      recommendation: recs[type] || 'Практикуйтесь регулярно',
      icon: icons[type] || '🎯',
    });
  });

  return topics.sort((a, b) => b.errorRate - a.errorRate);
}

const ErrorAnalysis: React.FC = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'words' | 'tips'>('overview');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | string>('all');

  const errors = buildErrorsFromDictionaries(state.dictionaries);
  const weakTopics = buildWeakTopics(errors);

  const totalErrors = errors.reduce((s, e) => s + e.count, 0);
  const avgDifficulty = errors.length
    ? Math.round(errors.reduce((s, e) => s + e.difficulty, 0) / errors.length)
    : 0;
  const mostCommonType = weakTopics[0]?.topic || '—';

  const filtered = filter === 'all' ? errors : errors.filter(e => e.errorType === filter);

  const getAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Пользователь изучает языки. Топ ошибок: ${errors.slice(0, 5).map(e => `"${e.word}" (${e.count} раз)`).join(', ')}. Слабые стороны: ${weakTopics.map(t => t.topic).join(', ')}. Дай 4 конкретных совета по улучшению на русском языке, каждый в одно предложение.`,
          }],
        }),
      });
      const data = await res.json();
      if (data.content) {
        const tips = data.content
          .split('\n')
          .filter((l: string) => l.trim().length > 10)
          .slice(0, 4)
          .map((l: string) => l.replace(/^\d+[.)]\s*/, '').trim());
        setAiTips(tips);
      }
    } catch {
      setAiTips([
        'Повторяйте сложные слова каждый день с помощью карточек.',
        'Пишите примеры предложений с новыми словами для лучшего запоминания.',
        'Используйте метод интервального повторения — занимайтесь 15-20 минут ежедневно.',
        'Практикуйте разговор с ИИ-тьютором по темам, где допускаете больше ошибок.',
      ]);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (errors.length > 0 && aiTips.length === 0) {
      getAiRecommendations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ea-page">
      <div className="ea-header">
        <div className="ea-header-left">
          <div className="ea-header-icon"><Brain size={22} /></div>
          <div>
            <h1>AI-анализ ошибок</h1>
            <p>Персональная аналитика слабых мест и рекомендации</p>
          </div>
        </div>
        <button className="ea-refresh-btn" onClick={getAiRecommendations} disabled={aiLoading}>
          <RefreshCw size={14} className={aiLoading ? 'spin' : ''} />
          Обновить анализ
        </button>
      </div>

      {/* Stat cards */}
      <div className="ea-stats">
        <div className="ea-stat-card">
          <div className="ea-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="ea-stat-val">{totalErrors}</div>
            <div className="ea-stat-lbl">Всего ошибок</div>
          </div>
        </div>
        <div className="ea-stat-card">
          <div className="ea-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
            <Target size={20} />
          </div>
          <div>
            <div className="ea-stat-val">{errors.length}</div>
            <div className="ea-stat-lbl">Проблемных слов</div>
          </div>
        </div>
        <div className="ea-stat-card">
          <div className="ea-stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="ea-stat-val">{avgDifficulty}%</div>
            <div className="ea-stat-lbl">Средн. сложность</div>
          </div>
        </div>
        <div className="ea-stat-card">
          <div className="ea-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="ea-stat-val ea-stat-val-sm">{mostCommonType}</div>
            <div className="ea-stat-lbl">Главная проблема</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ea-tabs">
        {(['overview', 'words', 'tips'] as const).map(tab => (
          <button
            key={tab}
            className={`ea-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? '📊 Обзор' : tab === 'words' ? '📝 Проблемные слова' : '💡 Советы ИИ'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="ea-content">
          {weakTopics.length === 0 ? (
            <div className="ea-empty">
              <CheckCircle size={48} style={{ color: '#10b981' }} />
              <h3>Отличная работа!</h3>
              <p>Ошибок не найдено. Продолжайте заниматься — данные появятся после практики с карточками.</p>
            </div>
          ) : (
            <div className="ea-topics">
              {weakTopics.map(topic => (
                <div key={topic.topic} className="ea-topic-card">
                  <div className="ea-topic-header">
                    <span className="ea-topic-icon">{topic.icon}</span>
                    <div className="ea-topic-info">
                      <div className="ea-topic-name">{topic.topic}</div>
                      <div className="ea-topic-count">{topic.totalAttempts} слов с ошибками</div>
                    </div>
                    <div className="ea-topic-rate" style={{
                      color: topic.errorRate > 60 ? '#f87171' : topic.errorRate > 30 ? '#fbbf24' : '#34d399'
                    }}>
                      {topic.errorRate}%
                    </div>
                  </div>
                  <div className="ea-topic-bar-bg">
                    <div
                      className="ea-topic-bar-fill"
                      style={{
                        width: `${topic.errorRate}%`,
                        background: topic.errorRate > 60 ? '#ef4444' : topic.errorRate > 30 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                  <div className="ea-topic-rec">
                    <Zap size={12} /> {topic.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Words */}
      {activeTab === 'words' && (
        <div className="ea-content">
          <div className="ea-filter-row">
            {(['all', 'vocabulary', 'translation', 'grammar', 'spelling'] as const).map(f => (
              <button
                key={f}
                className={`ea-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                style={filter === f && f !== 'all' ? { borderColor: ERROR_TYPE_COLORS[f], color: ERROR_TYPE_COLORS[f] } : {}}
              >
                {f === 'all' ? 'Все' : ERROR_TYPE_LABELS[f]}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="ea-empty">
              <CheckCircle size={40} style={{ color: '#10b981' }} />
              <p>Проблемных слов не найдено</p>
            </div>
          ) : (
            <div className="ea-words-list">
              {filtered.map(err => (
                <div key={err.id} className="ea-word-row">
                  <div className="ea-word-main">
                    <span className="ea-word-term">{err.word}</span>
                    <span className="ea-word-trans">{err.translation}</span>
                  </div>
                  <div className="ea-word-meta">
                    <span
                      className="ea-word-type"
                      style={{ background: ERROR_TYPE_COLORS[err.errorType] + '20', color: ERROR_TYPE_COLORS[err.errorType] }}
                    >
                      {ERROR_TYPE_LABELS[err.errorType]}
                    </span>
                    <span className="ea-word-count">{err.count}× ошибок</span>
                    <div className="ea-word-diff-bar">
                      <div className="ea-word-diff-fill" style={{ width: `${err.difficulty}%`, background: err.difficulty > 60 ? '#ef4444' : '#f59e0b' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Tips */}
      {activeTab === 'tips' && (
        <div className="ea-content">
          {aiLoading ? (
            <div className="ea-tips-loading">
              <div className="ea-spinner" />
              <p>ИИ анализирует ваши ошибки...</p>
            </div>
          ) : aiTips.length > 0 ? (
            <div className="ea-tips-list">
              {aiTips.map((tip, i) => (
                <div key={i} className="ea-tip-card">
                  <div className="ea-tip-num">{i + 1}</div>
                  <div className="ea-tip-text">{tip}</div>
                </div>
              ))}
              <button className="ea-refresh-tips-btn" onClick={getAiRecommendations}>
                <RefreshCw size={14} /> Получить новые советы
              </button>
            </div>
          ) : (
            <div className="ea-empty">
              <Brain size={48} style={{ color: 'var(--brand, #4a6cf7)' }} />
              <h3>Нет данных для анализа</h3>
              <p>Занимайтесь с карточками, и ИИ даст персональные рекомендации на основе ваших ошибок.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorAnalysis;
