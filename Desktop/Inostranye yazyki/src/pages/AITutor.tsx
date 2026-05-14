import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Send, RefreshCw, Lightbulb, BookOpen, Zap, Target, ArrowRight, Trash2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAIRecommendations, generateAITip, getAdaptiveNextLevel, generateExercises } from '../services/aiService';
import { LANGUAGE_NAMES } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';
import './AITutor.css';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
  testPath?: string;
  dictWords?: { term: string; translation: string }[];
  dictTopic?: string;
}

type AIMode = 'tutor' | 'translate' | 'grammar' | 'dialog';

const MODES: { key: AIMode; label: string; icon: string }[] = [
  { key: 'tutor', label: 'Тьютор', icon: '💬' },
  { key: 'translate', label: 'Переводчик', icon: '🌐' },
  { key: 'grammar', label: 'Грамматика', icon: '📖' },
  { key: 'dialog', label: 'Диалоги', icon: '🎭' },
];

type AIPersona = 'tutor' | 'british';

const PERSONAS: { key: AIPersona; label: string; flag: string; desc: string; prompt: string }[] = [
  {
    key: 'tutor',
    label: 'Тьютор',
    flag: '🎓',
    desc: 'Нейтральный, понятный',
    prompt: 'Ты — дружелюбный преподаватель. Объясняй просто и понятно.',
  },
  {
    key: 'british',
    label: 'British Teacher',
    flag: '🇬🇧',
    desc: 'Вежливый, академичный',
    prompt: 'Ты — вежливый британский учитель. Говори формально, с небольшим юмором. Используй британский английский где уместно. Будь немного саркастичен, но добр.',
  },
];

const QUICK_QUESTIONS: Record<AIMode, string[]> = {
  tutor: [
    'Как улучшить произношение?',
    'Советы по запоминанию слов',
    'Как поддерживать мотивацию?',
    'Лучший метод изучения языка',
    'Как часто нужно заниматься?',
    'Объясни систему повторений',
  ],
  translate: [
    'Как сказать "спасибо" на английском?',
    'Переведи фразу "я люблю путешествовать"',
    'Переведи предложение с контекстом',
    'Какие есть синонимы слова "хороший"?',
  ],
  grammar: [
    'Объясни Present Perfect',
    'Когда использовать артикли?',
    'Разница между say и tell',
    'Объясни условные предложения',
  ],
  dialog: [
    'Придумай диалог в магазине',
    'Создай историю про путешествие',
    'Диалог на тему "Знакомство"',
    'Расскажи историю на прошедшее время',
  ],
};

const AI_CHAT_URL = '/api/ai-chat';

const AITutor: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { user, flashcards, dictionaries, currentLanguage } = state;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('linguaai_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch { /* ignore */ }
    }
    return [{
      id: '1',
      role: 'ai',
      text: `Привет, ${user?.name || 'студент'}! Я ваш персональный тьютор.`,
      timestamp: new Date(),
    }];
  });
  const [mode, setMode] = useState<AIMode>('tutor');
  const [persona, setPersona] = useState<AIPersona>(() => {
    const saved = localStorage.getItem('linguaai_chat_persona');
    return (saved as AIPersona) || 'tutor';
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('linguaai_chat', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('linguaai_chat_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('linguaai_chat_persona', persona);
  }, [persona]);

  const allWords = dictionaries.flatMap(d => d.words);
  const recommendations = user ? getAIRecommendations(user, flashcards) : [];
  const langProgress = user?.learningLanguages.find(l => l.language === currentLanguage);
  const suggestedLevel = langProgress ? getAdaptiveNextLevel(langProgress.level, langProgress.accuracy) : null;
  const dueCards = flashcards.filter(f => f.word.language === currentLanguage && new Date(f.nextReviewDate) <= new Date());

  const exercises = generateExercises(
    flashcards.filter(f => f.word.language === currentLanguage).slice(0, 5),
    allWords.filter(w => w.language === currentLanguage),
    3
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const personaData = PERSONAS.find(p => p.key === persona) || PERSONAS[0];

  const getSystemPrompt = (m: AIMode): string => {
    const base = `Ты персональный преподаватель иностранных языков в приложении LinguaAI. Пользователь изучает ${LANGUAGE_NAMES[currentLanguage]}. Отвечай на русском, если не попросили иначе. Не используй ** или *.

${personaData.prompt}`;
    switch (m) {
      case 'tutor': return `${base}
Ты — тьютор. Помогай с произношением, грамматикой, лексикой, методиками запоминания.
Если пользователь хочет тест — добавь маркер [TEST:/games/speed], [TEST:/games/matching], [TEST:/flashcards] или [TEST:/games].
Если просит словарь — составь список в формате "слово — перевод", каждое слово с новой строки. В конце добавь маркер [DICT:тема].`;
      case 'translate': return `${base}
Ты — переводчик. Переводи точно, но живо. Давай контекст использования, синонимы, примеры предложений. Если слово имеет несколько значений — перечисли их.`;
      case 'grammar': return `${base}
Ты — эксперт по грамматике. Объясняй правила простым языком, давай примеры, показывай типичные ошибки. Используй сравнительные таблицы где уместно.`;
      case 'dialog': return `${base}
Ты — автор диалогов и историй. Создавай интересные диалоги и короткие истории для изучаемого языка. Указывай уровень сложности (A1-C2). Давай перевод ключевых фраз.`;
    }
  };



  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: getSystemPrompt(mode) },
            ...history,
            { role: 'user', content: msgText },
          ],
          maxTokens: 1024,
          temperature: 0.7,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const rawText: string =
        data?.content ||
        data?.choices?.[0]?.message?.content ||
        'Не удалось получить ответ. Попробуйте ещё раз.';
      const testMatch = rawText.match(/\[TEST:([^\]]+)\]/);
      const testPath = testMatch ? testMatch[1] : undefined;
      const dictMatch = rawText.match(/\[DICT:([^\]]+)\]/);
      const dictTopic = dictMatch ? dictMatch[1] : undefined;
      const dictWords: { term: string; translation: string }[] = [];
      if (dictTopic) {
        const lines = rawText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('**')) continue;
          const m = trimmed.match(/^[-\s•]*([^\n—\-–:]+)[\s]*[—\-–][\s]*(.+)$/);
          if (m) {
            const term = m[1].trim();
            const translation = m[2].trim();
            if (term && translation && term.length < 60 && translation.length < 100) {
              dictWords.push({ term, translation });
            }
          }
        }
      }
      const aiText = rawText
        .replace(/\[TEST:[^\]]+\]/g, '')
        .replace(/\[DICT:[^\]]+\]/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^[\s]*[-–—]{2,}[\s]*$/gm, '')
        .trim();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiText,
        timestamp: new Date(),
        testPath,
        dictWords: dictWords.length > 0 ? dictWords : undefined,
        dictTopic,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Ошибка соединения с ИИ. Проверьте подключение к интернету и попробуйте снова.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getDailyTip = () => {
    const tip = generateAITip(currentLanguage);
    const msg: Message = {
      id: Date.now().toString(),
      role: 'ai',
      text: `💡 Совет дня:\n\n${tip}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'ai',
      text: `Привет, ${user?.name || 'студент'}! Я ваш персональный тьютор.`,
      timestamp: new Date(),
    }]);
  };

  const createDictionaryFromAI = (words: { term: string; translation: string }[], topic: string) => {
    const newDict = {
      id: uuidv4(),
      name: topic,
      description: `Словарь на тему "${topic}" — создано AI`,
      language: currentLanguage,
      level: 'beginner',
      category: 'topic',
      words: words.map((w, i) => ({
        id: uuidv4(),
        term: w.term,
        translation: w.translation,
        definition: '',
        examples: [],
        language: currentLanguage,
        difficulty: 1,
        tags: [topic.toLowerCase()],
        audioUrl: '',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      flashcardCount: words.length,
    };
    dispatch({ type: 'ADD_DICTIONARY', payload: newDict as any });
  };

  return (
    <div className="ai-tutor-page">
      <div className="ai-tutor-layout">
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ai-avatar">
                <Brain size={20} />
              </div>
              <div>
                <div className="ai-name">LinguaAI Тьютор</div>
                <div className="ai-status">Ассистент · онлайн</div>
              </div>
            </div>
            <button className="ai-clear-btn" onClick={clearChat} title="Очистить чат">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="ai-mode-tabs">
            {MODES.map(m => (
              <button
                key={m.key}
                className={`ai-mode-tab ${mode === m.key ? 'active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>

          <div className="ai-persona-bar">
            <span className="ai-persona-label">Персонаж:</span>
            {PERSONAS.map(p => (
              <button
                key={p.key}
                className={`ai-persona-btn ${persona === p.key ? 'active' : ''}`}
                onClick={() => setPersona(p.key)}
                title={p.desc}
              >
                <span>{p.flag}</span>
                <span className="ai-persona-name">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="ai-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="msg-avatar"><Brain size={14} /></div>
                )}
                <div className="msg-bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                  ))}
                  {msg.role === 'ai' && msg.testPath && (
                    <button
                      className="ai-test-btn"
                      onClick={() => navigate(msg.testPath!)}
                    >
                      {msg.testPath === '/games/speed' ? 'Скоростной раунд' :
                       msg.testPath === '/games/matching' ? 'Игра на соответствие' :
                       msg.testPath === '/flashcards' ? 'Карточки' :
                       msg.testPath === '/games' ? 'К играм' : 'Перейти'}
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {msg.role === 'ai' && msg.dictWords && msg.dictTopic && (
                    <button
                      className="ai-test-btn ai-dict-btn"
                      onClick={() => createDictionaryFromAI(msg.dictWords!, msg.dictTopic!)}
                    >
                      <Plus size={14} /> Добавить "{msg.dictTopic}" ({msg.dictWords.length} слов)
                    </button>
                  )}
                  <div className="msg-time">
                    {msg.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message ai">
                <div className="msg-avatar"><Brain size={14} /></div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-questions">
            {QUICK_QUESTIONS[mode].map((q: string) => (
              <button key={q} className="quick-q" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          <div className="ai-input-area">
            <input
              className="ai-input"
              placeholder={
                mode === 'tutor' ? 'Задайте вопрос тьютору...' :
                mode === 'translate' ? 'Введите фразу для перевода...' :
                mode === 'grammar' ? 'Спросите про грамматику...' :
                'Опишите, какой диалог нужен...'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button className="ai-send-btn" onClick={() => sendMessage()} disabled={!input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="ai-sidebar">
          <div className="ai-card">
            <div className="ai-card-header">
              <Lightbulb size={16} />
              <span>Совет дня</span>
              <button className="refresh-btn" onClick={getDailyTip}><RefreshCw size={12} /></button>
            </div>
            <p className="ai-tip-content">{generateAITip(currentLanguage)}</p>
          </div>

          <div className="ai-card">
            <div className="ai-card-header">
              <Target size={16} />
              <span>Мой прогресс</span>
            </div>
            <div className="progress-analysis">
              <div className="pa-item">
                <span>Точность</span>
                <div className="pa-bar">
                  <div className="pa-fill" style={{ width: `${langProgress?.accuracy || 0}%`, background: (langProgress?.accuracy || 0) >= 70 ? '#10b981' : '#f59e0b' }} />
                </div>
                <span className="pa-val">{langProgress?.accuracy || 0}%</span>
              </div>
              <div className="pa-item">
                <span>Прогресс XP</span>
                <div className="pa-bar">
                  <div className="pa-fill" style={{ width: `${((langProgress?.xp || 0) % 500) / 5}%` }} />
                </div>
                <span className="pa-val">{langProgress?.xp || 0}</span>
              </div>
              {suggestedLevel && suggestedLevel !== langProgress?.level && (
                <div className="level-suggestion">
                  <Zap size={13} />
                  ИИ рекомендует: <strong>{suggestedLevel}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="ai-card">
            <div className="ai-card-header">
              <BookOpen size={16} />
              <span>Рекомендации</span>
            </div>
            <div className="rec-list-ai">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="rec-ai-item">
                  <div className="rec-ai-icon">
                    {rec.type === 'exercise' ? <Zap size={12} /> : rec.type === 'tip' ? <Lightbulb size={12} /> : <BookOpen size={12} />}
                  </div>
                  <div>
                    <div className="rec-ai-title">{rec.title}</div>
                    <div className="rec-ai-desc">{rec.description.substring(0, 60)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-card">
            <div className="ai-card-header">
              <Brain size={16} />
              <span>Упражнения</span>
            </div>
            <div className="mini-exercises">
              {exercises.slice(0, 3).map((ex, i) => (
                <div key={i} className="mini-ex">
                  <div className="mini-ex-word">{ex.word.term}</div>
                  <div className="mini-ex-hint">→ {ex.correctAnswer.split(',')[0]}</div>
                </div>
              ))}
              {exercises.length === 0 && (
                <p className="empty-ex">Добавьте слова в словари для упражнений</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
