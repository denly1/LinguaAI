import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Check, RotateCcw, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast/Toast';
import './SpeedRound.css';

const DURATIONS = [30, 60, 120];

const SpeedRound: React.FC = () => {
  const { state, updateFlashcardAfterReview, completeStudySession } = useApp();
  const { showXP, showAchievement } = useToast();
  const { flashcards, currentLanguage } = state;

  const [gameState, setGameState] = useState<'select' | 'playing' | 'done'>('select');
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [idx, setIdx] = useState(0);
  const [cards, setCards] = useState<typeof flashcards>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');

  const langCards = flashcards.filter(f => f.word.language === currentLanguage);

  const buildOptions = useCallback((cardIdx: number, pool: typeof flashcards) => {
    const correct = pool[cardIdx].word.translation;
    const distractors = pool
      .filter((_, i) => i !== cardIdx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.word.translation);
    return [...distractors, correct].sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = useCallback(() => {
    const shuffled = [...langCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswered(0);
    setTimeLeft(duration);
    setFeedback(null);
    setTypedAnswer('');
    if (shuffled.length > 0) setOptions(buildOptions(0, shuffled));
    setGameState('playing');
  }, [langCards, duration, buildOptions]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      const xp = Math.round(score * 3);
      showXP(xp);
      if (maxStreak >= 10) showAchievement('Серия 10+');
      completeStudySession(currentLanguage, answered, score, Math.ceil(duration / 60));
      setGameState('done');
      return;
    }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current && typingMode) {
      inputRef.current.focus();
    }
  }, [idx, gameState, typingMode]);

  const handleAnswer = useCallback((answer: string) => {
    if (gameState !== 'playing' || !cards[idx]) return;
    const card = cards[idx];
    const correct = answer.trim().toLowerCase().includes(
      card.word.translation.toLowerCase().split(',')[0].trim().substring(0, 4)
    );
    updateFlashcardAfterReview(card.id, correct);
    setFeedback(correct ? 'correct' : 'wrong');
    setAnswered(a => a + 1);
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(m => Math.max(m, newStreak));
      setScore(s => s + 1 + Math.floor(newStreak / 5));
    } else {
      setStreak(0);
    }
    setTypedAnswer('');
    setTimeout(() => {
      setFeedback(null);
      const nextIdx = (idx + 1) % cards.length;
      setIdx(nextIdx);
      setOptions(buildOptions(nextIdx, cards));
    }, 300);
  }, [gameState, cards, idx, streak, updateFlashcardAfterReview, buildOptions]);

  useEffect(() => {
    if (gameState !== 'playing' || typingMode) return;
    const handler = (e: KeyboardEvent) => {
      if (['1','2','3','4'].includes(e.key)) {
        const optIdx = parseInt(e.key) - 1;
        if (options[optIdx]) handleAnswer(options[optIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, options, handleAnswer, typingMode]);

  const timerPct = (timeLeft / duration) * 100;
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981';

  if (gameState === 'select') {
    return (
      <div className="speed-page page-enter">
        <div className="speed-setup">
          <div className="speed-setup-icon">⚡</div>
          <h1>Speed Round</h1>
          <p>Отвечайте как можно быстрее! Каждая серия даёт бонусные очки.</p>
          <div className="speed-options">
            <div className="speed-option-group">
              <label>Длительность</label>
              <div className="speed-duration-btns">
                {DURATIONS.map(d => (
                  <button key={d} className={`dur-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>
                    {d}с
                  </button>
                ))}
              </div>
            </div>
            <div className="speed-option-group">
              <label>Режим ответа</label>
              <div className="speed-mode-btns">
                <button className={`mode-btn ${!typingMode ? 'active' : ''}`} onClick={() => setTypingMode(false)}>
                  🎯 Варианты
                </button>
                <button className={`mode-btn ${typingMode ? 'active' : ''}`} onClick={() => setTypingMode(true)}>
                  ⌨️ Ввод
                </button>
              </div>
            </div>
          </div>
          {langCards.length < 4 ? (
            <p className="no-cards-warning">Нужно минимум 4 карточки.</p>
          ) : (
            <button className="btn-start-speed" onClick={startGame}>
              <Zap size={18} /> Старт!
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'done') {
    const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0;
    return (
      <div className="speed-page page-enter">
        <div className="speed-results">
          <div className="speed-result-icon">{score >= 20 ? '🔥' : score >= 10 ? '⚡' : '💪'}</div>
          <h2>Время вышло!</h2>
          <div className="speed-result-grid">
            <div className="sr-card"><Zap size={18} color="#fbbf24" /><div className="src-val">{score}</div><div className="src-lbl">Очков</div></div>
            <div className="sr-card"><Check size={18} color="#34d399" /><div className="src-val">{answered}</div><div className="src-lbl">Ответов</div></div>
            <div className="sr-card"><TrendingUp size={18} color="#818cf8" /><div className="src-val">{accuracy}%</div><div className="src-lbl">Точность</div></div>
            <div className="sr-card"><span style={{fontSize:18}}>🔥</span><div className="src-val">{maxStreak}</div><div className="src-lbl">Макс. серия</div></div>
          </div>
          <div className="speed-result-actions">
            <button className="btn-start-speed" onClick={startGame}><RotateCcw size={16}/> Ещё раз</button>
            <button className="btn-back-speed" onClick={() => setGameState('select')}>Настройки</button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[idx];
  if (!card) return null;

  return (
    <div className="speed-page page-enter">
      <div className="speed-hud">
        <div className="speed-hud-item score"><Zap size={14} />{score} очков</div>
        <div className="speed-timer-wrap">
          <svg className="speed-timer-svg" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" className="timer-bg" />
            <circle
              cx="22" cy="22" r="18"
              className="timer-fill"
              style={{
                stroke: timerColor,
                strokeDasharray: `${2 * Math.PI * 18}`,
                strokeDashoffset: `${2 * Math.PI * 18 * (1 - timerPct / 100)}`,
              }}
            />
          </svg>
          <span className="speed-timer-text" style={{ color: timerColor }}>{timeLeft}</span>
        </div>
        <div className="speed-hud-item streak">🔥 {streak > 1 ? `x${streak}` : streak}</div>
      </div>

      <div className={`speed-card ${feedback === 'correct' ? 'correct-flash' : feedback === 'wrong' ? 'wrong-flash' : ''}`}>
        <div className="speed-word">{card.word.term}</div>
        {card.word.phonetic && <div className="speed-phonetic">{card.word.phonetic}</div>}
        {streak >= 3 && <div className="streak-badge-inline">🔥 Серия x{streak}</div>}
      </div>

      {typingMode ? (
        <div className="speed-typing">
          <input
            ref={inputRef}
            className="speed-input"
            placeholder="Введите перевод..."
            value={typedAnswer}
            onChange={e => setTypedAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && typedAnswer.trim()) handleAnswer(typedAnswer); }}
            autoFocus
          />
          <button className="speed-submit" onClick={() => typedAnswer.trim() && handleAnswer(typedAnswer)} disabled={!typedAnswer.trim()}>
            <Check size={18} />
          </button>
        </div>
      ) : (
        <div className="speed-options-grid">
          {options.map((opt, i) => (
            <button
              key={opt}
              className={`speed-option ${feedback === 'correct' && opt === card.word.translation ? 'opt-correct' : feedback === 'wrong' && opt === card.word.translation ? 'opt-correct' : ''}`}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
            >
              <span className="opt-key">{i + 1}</span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeedRound;
