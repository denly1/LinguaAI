import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, X, ChevronLeft, ChevronRight, Zap, Brain, Keyboard, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast/Toast';
import { speakWord } from '../services/exportService';
import { Exercise } from '../types';
import { generateExercises } from '../services/aiService';
import './Flashcards.css';

type Mode = 'browse' | 'study' | 'quiz' | 'results';

const Flashcards: React.FC = () => {
  const { state, updateFlashcardAfterReview, completeStudySession } = useApp();
  const { showXP, showAchievement } = useToast();
  const { flashcards, dictionaries, currentLanguage } = state;

  const [mode, setMode] = useState<Mode>('browse');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState<'all' | 'due' | 'new' | 'learning' | 'mastered'>('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ correct: number; total: number; startTime: number }>({ correct: 0, total: 0, startTime: Date.now() });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const allWords = dictionaries.flatMap(d => d.words);
  const langCards = flashcards.filter(f => f.word.language === currentLanguage);
  const filteredCards = langCards.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'due') return new Date(c.nextReviewDate) <= new Date();
    return c.status === filter;
  });

  // Keyboard shortcuts for browse mode
  useEffect(() => {
    if (mode !== 'browse') return;
    const handler = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFlipped(f => !f);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIdx(i => Math.min(filteredCards.length - 1, i + 1));
        setFlipped(false);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIdx(i => Math.max(0, i - 1));
        setFlipped(false);
      }
      if (e.key === '1') { updateFlashcardAfterReview(filteredCards[currentIdx]?.id, false); }
      if (e.key === '2') { updateFlashcardAfterReview(filteredCards[currentIdx]?.id, true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, filteredCards, currentIdx, updateFlashcardAfterReview]);

  // Keyboard shortcuts for quiz mode
  useEffect(() => {
    if (mode !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && answerChecked) nextQuizQuestion();
      if (!answerChecked && exercises[exerciseIdx]?.options) {
        const idx = parseInt(e.key) - 1;
        const opts = exercises[exerciseIdx].options!;
        if (idx >= 0 && idx < opts.length) handleQuizSelect(opts[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, answerChecked, exerciseIdx, exercises]);

  const currentCard = filteredCards[currentIdx];

  const statusLabels: Record<string, string> = {
    new: 'Новое',
    learning: 'Изучается',
    review: 'Повторение',
    mastered: 'Усвоено',
  };

  const filterCounts = {
    all: langCards.length,
    due: langCards.filter(c => new Date(c.nextReviewDate) <= new Date()).length,
    new: langCards.filter(c => c.status === 'new').length,
    learning: langCards.filter(c => c.status === 'learning').length,
    mastered: langCards.filter(c => c.status === 'mastered').length,
  };

  const startStudy = useCallback(() => {
    const dueCards = langCards.filter(c => new Date(c.nextReviewDate) <= new Date());
    const studyCards = dueCards.length > 0 ? dueCards : filteredCards;
    if (studyCards.length === 0) return;
    const exs = generateExercises(studyCards.slice(0, 20), allWords, Math.min(20, studyCards.length));
    setExercises(exs as Exercise[]);
    setExerciseIdx(0);
    setSessionResults({ correct: 0, total: 0, startTime: Date.now() });
    setShowAnswer(false);
    setTypingAnswer('');
    setSelectedOption(null);
    setAnswerChecked(false);
    setMode('study');
  }, [langCards, filteredCards, allWords]);

  const startQuiz = useCallback(() => {
    const cards = filteredCards.length > 0 ? filteredCards : langCards;
    const exs = generateExercises(cards.slice(0, 15), allWords, Math.min(15, cards.length));
    setExercises(exs.filter(e => e.type === 'multiple-choice') as Exercise[]);
    setExerciseIdx(0);
    setSessionResults({ correct: 0, total: 0, startTime: Date.now() });
    setSelectedOption(null);
    setAnswerChecked(false);
    setMode('quiz');
  }, [filteredCards, langCards, allWords]);

  const handleStudyAnswer = (correct: boolean) => {
    const ex = exercises[exerciseIdx];
    updateFlashcardAfterReview(ex.id, correct);
    setSessionResults(prev => ({ ...prev, correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    if (exerciseIdx + 1 >= exercises.length) {
      finishSession(sessionResults.correct + (correct ? 1 : 0), sessionResults.total + 1);
    } else {
      setExerciseIdx(i => i + 1);
      setShowAnswer(false);
      setTypingAnswer('');
    }
  };

  const handleQuizSelect = (option: string) => {
    if (answerChecked) return;
    const ex = exercises[exerciseIdx];
    setSelectedOption(option);
    setAnswerChecked(true);
    const correct = option === ex.correctAnswer;
    updateFlashcardAfterReview(ex.id, correct);
    setSessionResults(prev => ({ ...prev, correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  };

  const nextQuizQuestion = () => {
    if (exerciseIdx + 1 >= exercises.length) {
      finishSession(sessionResults.correct, sessionResults.total);
    } else {
      setExerciseIdx(i => i + 1);
      setSelectedOption(null);
      setAnswerChecked(false);
    }
  };

  const finishSession = (correct: number, total: number) => {
    const duration = Math.round((Date.now() - sessionResults.startTime) / 60000);
    completeStudySession(currentLanguage, total, correct, Math.max(1, duration));
    const xp = Math.round(correct * 5 + Math.max(1, duration) * 2);
    showXP(xp);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    if (accuracy === 100 && total >= 5) showAchievement('Идеальная сессия! 💯');
    if (correct >= 20) showAchievement('20+ правильных ответов! 🔥');
    setSessionResults(prev => ({ ...prev, correct, total }));
    setMode('results');
  };

  const checkTypingAnswer = () => {
    const ex = exercises[exerciseIdx];
    const correct = typingAnswer.trim().toLowerCase().includes(
      ex.correctAnswer.toLowerCase().split(',')[0].trim().toLowerCase().substring(0, 5)
    );
    setShowAnswer(true);
    handleStudyAnswer(correct);
  };

  if (mode === 'results') {
    const accuracy = sessionResults.total > 0 ? Math.round((sessionResults.correct / sessionResults.total) * 100) : 0;
    return (
      <div className="flashcards-page">
        <div className="results-screen">
          <div className="results-emoji">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}</div>
          <h2>Сессия завершена!</h2>
          <div className="results-stats">
            <div className="res-stat">
              <div className="res-val">{sessionResults.correct}</div>
              <div className="res-lbl">Правильно</div>
            </div>
            <div className="res-stat">
              <div className="res-val">{sessionResults.total - sessionResults.correct}</div>
              <div className="res-lbl">Ошибки</div>
            </div>
            <div className="res-stat">
              <div className="res-val">{accuracy}%</div>
              <div className="res-lbl">Точность</div>
            </div>
          </div>
          <div className="results-actions">
            <button className="btn-primary" onClick={() => { setMode('browse'); }}>
              Вернуться к карточкам
            </button>
            <button className="btn-secondary" onClick={startStudy}>
              Повторить ещё раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'study' && exercises.length > 0) {
    const ex = exercises[exerciseIdx];
    const progress = ((exerciseIdx) / exercises.length) * 100;
    return (
      <div className="flashcards-page">
        <div className="study-header">
          <button className="btn-icon" onClick={() => setMode('browse')}><ChevronLeft size={20} /></button>
          <div className="study-progress">
            <div className="study-progress-bar">
              <div className="study-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{exerciseIdx + 1} / {exercises.length}</span>
          </div>
          <div className="study-score">
            <Check size={14} color="#10b981" /> {sessionResults.correct}
          </div>
        </div>

        <div className="study-card">
          <div className="study-word">{ex.word.term}</div>
          {ex.word.phonetic && <div className="study-phonetic">{ex.word.phonetic}</div>}
          {ex.word.partOfSpeech && <div className="study-pos">{ex.word.partOfSpeech}</div>}

          {ex.word.examples.length > 0 && (
            <div className="study-example">"{ex.word.examples[0]}"</div>
          )}

          {!showAnswer ? (
            <div className="study-input-area">
              <input
                className="study-input"
                placeholder="Введите перевод..."
                value={typingAnswer}
                onChange={e => setTypingAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && typingAnswer && checkTypingAnswer()}
                autoFocus
              />
              <div className="study-buttons">
                <button className="btn-secondary" onClick={() => setShowAnswer(true)}>
                  Показать ответ
                </button>
                <button
                  className="btn-primary"
                  onClick={checkTypingAnswer}
                  disabled={!typingAnswer.trim()}
                >
                  Проверить
                </button>
              </div>
            </div>
          ) : (
            <div className="study-answer-revealed">
              <div className="answer-text">{ex.correctAnswer}</div>
              <div className="study-buttons">
                <button className="btn-wrong" onClick={() => handleStudyAnswer(false)}>
                  <X size={16} /> Не знал
                </button>
                <button className="btn-correct" onClick={() => handleStudyAnswer(true)}>
                  <Check size={16} /> Знал
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'quiz' && exercises.length > 0) {
    const ex = exercises[exerciseIdx];
    const progress = (exerciseIdx / exercises.length) * 100;
    return (
      <div className="flashcards-page">
        <div className="study-header">
          <button className="btn-icon" onClick={() => setMode('browse')}><ChevronLeft size={20} /></button>
          <div className="study-progress">
            <div className="study-progress-bar">
              <div className="study-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{exerciseIdx + 1} / {exercises.length}</span>
          </div>
          <div className="study-score">
            <Check size={14} color="#10b981" /> {sessionResults.correct}
          </div>
        </div>

        <div className="quiz-card">
          <div className="quiz-question">Как переводится:</div>
          <div className="quiz-word">{ex.word.term}</div>
          {ex.word.phonetic && <div className="study-phonetic">{ex.word.phonetic}</div>}

          <div className="quiz-options">
            {ex.options?.map(opt => (
              <button
                key={opt}
                className={`quiz-option ${selectedOption === opt
                  ? opt === ex.correctAnswer ? 'correct' : 'wrong'
                  : answerChecked && opt === ex.correctAnswer ? 'correct' : ''}`}
                onClick={() => handleQuizSelect(opt)}
                disabled={answerChecked}
              >
                {opt}
              </button>
            ))}
          </div>

          {answerChecked && (
            <button className="btn-primary next-btn" onClick={nextQuizQuestion}>
              {exerciseIdx + 1 >= exercises.length ? 'Завершить' : 'Следующий'} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const dueCount = langCards.filter(c => new Date(c.nextReviewDate) <= new Date()).length;

  return (
    <div className="flashcards-page">
      <div className="flashcards-header">
        <div>
          <h1>Карточки</h1>
          <p className="page-subtitle">{langCards.length} карточек · {langCards.filter(c => c.status === 'mastered').length} усвоено</p>
        </div>
        <div className="fc-actions">
          <button className="mode-btn" onClick={startStudy} disabled={dueCount === 0}>
            <Brain size={16} /> Изучение ({dueCount})
          </button>
          <button className="mode-btn" onClick={startQuiz} disabled={filteredCards.length === 0}>
            <Zap size={16} /> Тест
          </button>
        </div>
      </div>

      <div className="fc-filters">
        {(['all', 'due', 'new', 'learning', 'mastered'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setCurrentIdx(0); setFlipped(false); }}
          >
            {f === 'all' ? 'Все' : f === 'due' ? 'К повторению' : statusLabels[f]}
            <span className="filter-count">{filterCounts[f]}</span>
          </button>
        ))}
      </div>

      {filteredCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Нет карточек</h3>
          <p>Добавьте слова в словари, чтобы создать карточки.</p>
        </div>
      ) : (
        <div className="fc-main">
          <div className="card-counter">{currentIdx + 1} / {filteredCards.length}</div>

          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="fc-lang-badge">{currentCard.word.language.toUpperCase()}</div>
                <div className="fc-term">{currentCard.word.term}</div>
                {currentCard.word.phonetic && (
                  <div className="fc-phonetic">{currentCard.word.phonetic}</div>
                )}
                {currentCard.word.partOfSpeech && (
                  <div className="fc-pos">{currentCard.word.partOfSpeech}</div>
                )}
                      <button className="fc-tts-btn" onClick={e => { e.stopPropagation(); speakWord(currentCard.word.term, currentCard.word.language); }} title="Озвучить">
                  <Volume2 size={16} />
                </button>
                <div className="fc-flip-hint">Нажмите или пробел</div>
              </div>
              <div className="flashcard-back">
                <div className={`fc-status-badge status-${currentCard.status}`}>
                  {statusLabels[currentCard.status]}
                </div>
                <div className="fc-translation">{currentCard.word.translation}</div>
                {currentCard.word.examples.length > 0 && (
                  <div className="fc-example">"{currentCard.word.examples[0]}"</div>
                )}
                <div className="fc-stats">
                  <span>✓ {currentCard.correctCount}</span>
                  <span>✗ {currentCard.incorrectCount}</span>
                  <span>🔄 {currentCard.reviewCount}×</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fc-hotkeys-hint">
            <button className="hotkeys-toggle" onClick={() => setShowHints(h => !h)}>
              <Keyboard size={13} /> Горячие клавиши
            </button>
            {showHints && (
              <div className="hotkeys-list">
                <span><kbd>Пробел</kbd> Перевернуть</span>
                <span><kbd>←</kbd><kbd>→</kbd> Навигация</span>
                <span><kbd>1</kbd> Не знаю · <kbd>2</kbd> Знаю</span>
              </div>
            )}
          </div>

          <div className="fc-nav">
            <button
              className="btn-icon"
              onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={currentIdx === 0}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="fc-quick-actions">
              <button className="btn-wrong-sm" onClick={() => { updateFlashcardAfterReview(currentCard.id, false); }}>
                <RotateCcw size={14} /> Ещё раз
              </button>
              <button className="btn-correct-sm" onClick={() => { updateFlashcardAfterReview(currentCard.id, true); }}>
                <Check size={14} /> Знаю
              </button>
            </div>

            <button
              className="btn-icon"
              onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => Math.min(filteredCards.length - 1, i + 1)); setFlipped(false); }}
              disabled={currentIdx === filteredCards.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="fc-grid-preview">
            {filteredCards.slice(0, 30).map((card, i) => (
              <div
                key={card.id}
                className={`fc-dot status-${card.status} ${i === currentIdx ? 'active' : ''}`}
                onClick={() => { setCurrentIdx(i); setFlipped(false); }}
                title={card.word.term}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
