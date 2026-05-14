import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, RefreshCw, ChevronRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './VoiceTrainer.css';

interface PracticeWord {
  term: string;
  phonetic: string;
  translation: string;
  language: string;
}

const SAMPLE_WORDS: Record<string, PracticeWord[]> = {
  en: [
    { term: 'Hello', phonetic: '/həˈloʊ/', translation: 'Привет', language: 'en' },
    { term: 'Beautiful', phonetic: '/ˈbjuːtɪfəl/', translation: 'Красивый', language: 'en' },
    { term: 'Important', phonetic: '/ɪmˈpɔːrtənt/', translation: 'Важный', language: 'en' },
    { term: 'Understand', phonetic: '/ˌʌndərˈstænd/', translation: 'Понимать', language: 'en' },
    { term: 'Opportunity', phonetic: '/ˌɒpəˈtjuːnɪti/', translation: 'Возможность', language: 'en' },
    { term: 'Comfortable', phonetic: '/ˈkʌmftəbəl/', translation: 'Удобный', language: 'en' },
    { term: 'Experience', phonetic: '/ɪkˈspɪəriəns/', translation: 'Опыт', language: 'en' },
    { term: 'Pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃən/', translation: 'Произношение', language: 'en' },
  ],
  de: [
    { term: 'Guten Morgen', phonetic: '/ˈɡuːtən ˈmɔrɡən/', translation: 'Доброе утро', language: 'de' },
    { term: 'Danke schön', phonetic: '/ˈdaŋkə ʃøːn/', translation: 'Большое спасибо', language: 'de' },
    { term: 'Entschuldigung', phonetic: '/ɛntˈʃʊldɪɡʊŋ/', translation: 'Извините', language: 'de' },
    { term: 'Ausgezeichnet', phonetic: '/ˌaʊsɡəˈtsaɪçnət/', translation: 'Отлично', language: 'de' },
  ],
  fr: [
    { term: 'Bonjour', phonetic: '/bɔ̃ˈʒuʁ/', translation: 'Добрый день', language: 'fr' },
    { term: 'Merci beaucoup', phonetic: '/mɛʁsi boˈku/', translation: 'Большое спасибо', language: 'fr' },
    { term: 'Je ne comprends pas', phonetic: '/ʒə nə kɔ̃ˈpʁɑ̃ pa/', translation: 'Я не понимаю', language: 'fr' },
  ],
  es: [
    { term: 'Buenos días', phonetic: '/ˈbwenos ˈdias/', translation: 'Доброе утро', language: 'es' },
    { term: 'Muchas gracias', phonetic: '/ˈmutʃas ˈɡɾasjas/', translation: 'Большое спасибо', language: 'es' },
    { term: 'Lo siento', phonetic: '/lo ˈsjento/', translation: 'Извините', language: 'es' },
  ],
};

const LANG_CODES: Record<string, string> = {
  en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
  it: 'it-IT', zh: 'zh-CN', ja: 'ja-JP', pt: 'pt-BR',
};

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 85;
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const matches = words1.filter(w => words2.some(w2 => w2.startsWith(w.slice(0, 3)) || w.startsWith(w2.slice(0, 3))));
  return Math.round((matches.length / Math.max(words1.length, words2.length)) * 100);
}

type RecordStatus = 'idle' | 'listening' | 'processing' | 'done';
type ScoreLevel = 'perfect' | 'good' | 'try' | null;

const VoiceTrainer: React.FC = () => {
  const { state } = useApp();
  const [langFilter, setLangFilter] = useState<string>(state.currentLanguage || 'en');
  const [wordIdx, setWordIdx] = useState(0);
  const [status, setStatus] = useState<RecordStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [scoreLevel, setScoreLevel] = useState<ScoreLevel>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<any>(null);

  const words = SAMPLE_WORDS[langFilter] || SAMPLE_WORDS.en;
  const word = words[wordIdx % words.length];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  const speak = () => {
    if (!word) return;
    const utt = new SpeechSynthesisUtterance(word.term);
    utt.lang = LANG_CODES[langFilter] || 'en-US';
    utt.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = LANG_CODES[langFilter] || 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;
    setStatus('listening');
    setTranscript('');
    setScore(null);
    setScoreLevel(null);

    recog.onresult = (e: any) => {
      const results = Array.from(e.results[0]) as SpeechRecognitionAlternative[];
      const best = results.map(r => ({ t: r.transcript, s: similarity(r.transcript, word.term) }))
        .sort((a, b) => b.s - a.s)[0];
      setTranscript(best.t);
      const sc = best.s;
      setScore(sc);
      setScoreLevel(sc >= 85 ? 'perfect' : sc >= 60 ? 'good' : 'try');
      setSessionScores(prev => [...prev, sc]);
      setStatus('done');
    };

    recog.onerror = () => setStatus('idle');
    recog.onend = () => { if (status === 'listening') setStatus('idle'); };
    recog.start();
    setStatus('listening');
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setStatus('processing');
  };

  const next = () => {
    setWordIdx(i => i + 1);
    setStatus('idle');
    setTranscript('');
    setScore(null);
    setScoreLevel(null);
  };

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null;

  const availableLangs = Object.keys(SAMPLE_WORDS);

  return (
    <div className="vt-page">
      <div className="vt-header">
        <div className="vt-header-left">
          <div className="vt-header-icon"><Mic size={22} /></div>
          <div>
            <h1>Голосовой тренажёр</h1>
            <p>Отработайте произношение с оценкой в реальном времени</p>
          </div>
        </div>
        {avgScore !== null && (
          <div className="vt-session-score">
            <Trophy size={14} />
            Сессия: {avgScore}% · {sessionScores.length} слов
          </div>
        )}
      </div>

      {/* Lang selector */}
      <div className="vt-lang-row">
        {availableLangs.map(l => (
          <button
            key={l}
            className={`vt-lang-btn ${langFilter === l ? 'active' : ''}`}
            onClick={() => { setLangFilter(l); setWordIdx(0); setStatus('idle'); setScore(null); }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {!supported ? (
        <div className="vt-unsupported">
          <MicOff size={40} />
          <h3>Браузер не поддерживает распознавание речи</h3>
          <p>Используйте Google Chrome или Microsoft Edge для этой функции.</p>
        </div>
      ) : (
        <div className="vt-card">
          {/* Word display */}
          <div className="vt-word-block">
            <div className="vt-word-main">{word.term}</div>
            <div className="vt-word-phonetic">{word.phonetic}</div>
            <div className="vt-word-translation">{word.translation}</div>
            <button className="vt-listen-btn" onClick={speak} title="Прослушать произношение">
              <Volume2 size={16} /> Послушать
            </button>
          </div>

          {/* Result */}
          {status === 'done' && score !== null && (
            <div className={`vt-result vt-result-${scoreLevel}`}>
              {scoreLevel === 'perfect' && <><CheckCircle size={20} /> Отлично! Произношение точное</>}
              {scoreLevel === 'good' && <><CheckCircle size={20} /> Хорошо! Ещё немного практики</>}
              {scoreLevel === 'try' && <><XCircle size={20} /> Попробуйте ещё раз</>}
              <div className="vt-transcript">Вы сказали: «{transcript}»</div>
              <div className="vt-score-bar-wrap">
                <div className="vt-score-bar">
                  <div
                    className="vt-score-fill"
                    style={{
                      width: `${score}%`,
                      background: score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <span className="vt-score-pct">{score}%</span>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="vt-processing">
              <div className="vt-dots"><span /><span /><span /></div>
              Анализирую произношение...
            </div>
          )}

          {/* Controls */}
          <div className="vt-controls">
            {status === 'idle' || status === 'done' ? (
              <>
                <button
                  className="vt-record-btn"
                  onClick={startListening}
                >
                  <Mic size={20} /> {status === 'done' ? 'Повторить' : 'Начать запись'}
                </button>
                {status === 'done' && (
                  <button className="vt-next-btn" onClick={next}>
                    Следующее слово <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : status === 'listening' ? (
              <button className="vt-stop-btn" onClick={stopListening}>
                <div className="vt-pulse" />
                <MicOff size={20} /> Остановить запись
              </button>
            ) : null}
          </div>

          {/* Progress dots */}
          <div className="vt-progress-dots">
            {words.map((_, i) => (
              <div
                key={i}
                className={`vt-dot ${i < wordIdx % words.length ? 'done' : i === wordIdx % words.length ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Session history */}
      {sessionScores.length > 0 && (
        <div className="vt-history">
          <div className="vt-history-title">История сессии</div>
          <div className="vt-history-bars">
            {sessionScores.map((s, i) => (
              <div key={i} className="vt-history-bar-wrap" title={`${s}%`}>
                <div
                  className="vt-history-bar"
                  style={{
                    height: `${s}%`,
                    background: s >= 85 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            ))}
          </div>
          <button className="vt-reset-btn" onClick={() => setSessionScores([])}>
            <RefreshCw size={12} /> Сбросить
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceTrainer;
