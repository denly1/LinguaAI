import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Trophy, RotateCcw, CheckCircle, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast/Toast';
import './MatchingGame.css';

interface Card {
  id: string;
  text: string;
  type: 'term' | 'translation';
  wordId: string;
  matched: boolean;
  selected: boolean;
}

const MatchingGame: React.FC = () => {
  const { state, completeStudySession } = useApp();
  const { showXP, showAchievement, showToast } = useToast();
  const { flashcards, currentLanguage, dictionaries } = state;

  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState<'select' | 'playing' | 'done'>('select');
  const [pairCount, setPairCount] = useState(8);
  const [wrongPair, setWrongPair] = useState<string[]>([]);

  const langCards = flashcards.filter(f => f.word.language === currentLanguage);
  const availablePairs = Math.min(10, langCards.length);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dicts = dictionaries;

  const initGame = useCallback(() => {
    const pool = [...langCards].sort(() => Math.random() - 0.5).slice(0, pairCount);
    const gameCards: Card[] = [];
    pool.forEach(fc => {
      gameCards.push({ id: `t-${fc.id}`, text: fc.word.term, type: 'term', wordId: fc.id, matched: false, selected: false });
      gameCards.push({ id: `tr-${fc.id}`, text: fc.word.translation, type: 'translation', wordId: fc.id, matched: false, selected: false });
    });
    setCards(gameCards.sort(() => Math.random() - 0.5));
    setSelected(null);
    setMatchedCount(0);
    setErrors(0);
    setTime(0);
    setWrongPair([]);
    setGameState('playing');
  }, [langCards, pairCount]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleSelect = (card: Card) => {
    if (card.matched || gameState !== 'playing') return;
    if (selected?.id === card.id) { setSelected(null); return; }

    if (!selected) {
      setCards(cs => cs.map(c => c.id === card.id ? { ...c, selected: true } : c));
      setSelected(card);
      return;
    }

    // Check match
    if (selected.wordId === card.wordId && selected.type !== card.type) {
      setCards(cs => cs.map(c =>
        c.wordId === card.wordId ? { ...c, matched: true, selected: false } : c
      ));
      const newCount = matchedCount + 1;
      setMatchedCount(newCount);
      setSelected(null);
      showToast('Совпадение! 🎯', 'success');
      if (newCount === pairCount) {
        const xp = Math.max(10, Math.round(pairCount * 8 - errors * 2 - Math.floor(time / 10)));
        showXP(xp);
        if (errors === 0) showAchievement('Безупречно!');
        completeStudySession(currentLanguage, pairCount, pairCount - errors, Math.ceil(time / 60));
        setGameState('done');
      }
    } else {
      setWrongPair([selected.id, card.id]);
      setErrors(e => e + 1);
      setTimeout(() => {
        setCards(cs => cs.map(c => ({ ...c, selected: false })));
        setSelected(null);
        setWrongPair([]);
      }, 800);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  if (gameState === 'select') {
    return (
      <div className="matching-page page-enter">
        <div className="matching-setup">
          <div className="matching-setup-icon">🧩</div>
          <h1>Режим сопоставления</h1>
          <p>Соедините слова с их переводами как можно быстрее</p>
          <div className="pair-selector">
            <label>Количество пар:</label>
            <div className="pair-btns">
              {[4,6,8,10].filter(n => n <= availablePairs).map(n => (
                <button key={n} className={`pair-btn ${pairCount === n ? 'active' : ''}`} onClick={() => setPairCount(n)}>{n}</button>
              ))}
            </div>
          </div>
          {availablePairs < 4 ? (
            <p className="no-cards-warning">Нужно минимум 4 карточки. Добавьте слова в словари.</p>
          ) : (
            <button className="btn-start-game" onClick={initGame}>Начать игру</button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'done') {
    const accuracy = Math.round((pairCount / (pairCount + errors)) * 100);
    return (
      <div className="matching-page page-enter">
        <div className="matching-results">
          <div className="results-trophy">🎉</div>
          <h2>Игра завершена!</h2>
          <div className="match-result-grid">
            <div className="match-res-card"><Trophy size={18} color="#fbbf24" /><div className="mrc-val">{pairCount}</div><div className="mrc-lbl">Пар</div></div>
            <div className="match-res-card"><Timer size={18} color="#818cf8" /><div className="mrc-val">{fmt(time)}</div><div className="mrc-lbl">Время</div></div>
            <div className="match-res-card"><CheckCircle size={18} color="#34d399" /><div className="mrc-val">{accuracy}%</div><div className="mrc-lbl">Точность</div></div>
            <div className="match-res-card"><Zap size={18} color="#f87171" /><div className="mrc-val">{errors}</div><div className="mrc-lbl">Ошибок</div></div>
          </div>
          <div className="match-result-actions">
            <button className="btn-start-game" onClick={initGame}><RotateCcw size={16} /> Играть ещё</button>
            <button className="btn-back-game" onClick={() => setGameState('select')}>Выбор настроек</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-page page-enter">
      <div className="matching-header">
        <div className="match-stat"><Trophy size={15} />{matchedCount}/{pairCount}</div>
        <div className="match-stat timer"><Timer size={15} />{fmt(time)}</div>
        <div className="match-stat errors">✗ {errors}</div>
        <button className="match-quit-btn" onClick={() => setGameState('select')}>Выйти</button>
      </div>
      <div className="match-progress">
        <div className="match-progress-fill" style={{ width: `${(matchedCount / pairCount) * 100}%` }} />
      </div>
      <div className={`matching-grid pairs-${pairCount}`}>
        {cards.map(card => (
          <button
            key={card.id}
            className={`match-card
              ${card.type}
              ${card.matched ? 'matched' : ''}
              ${card.selected ? 'selected' : ''}
              ${wrongPair.includes(card.id) ? 'wrong' : ''}
            `}
            onClick={() => handleSelect(card)}
            disabled={card.matched}
          >
            {card.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MatchingGame;
