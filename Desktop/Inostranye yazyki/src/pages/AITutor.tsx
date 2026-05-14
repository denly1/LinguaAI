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

const QUICK_QUESTIONS = [
  'Как улучшить произношение?',
  'Советы по запоминанию слов',
  'Как поддерживать мотивацию?',
  'Лучший метод изучения языка',
  'Как часто нужно заниматься?',
  'Объясни систему повторений',
];

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
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('linguaai_chat', JSON.stringify(messages));
  }, [messages]);

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

  const systemPrompt = `Ты персональный преподаватель иностранных языков в образовательном приложении LinguaAI. Твоя задача — помогать пользователю эффективно изучать языки.

Данные пользователя:
- Имя: ${user?.name || 'студент'}
- Изучает: ${LANGUAGE_NAMES[currentLanguage]}
- Точность: ${langProgress?.accuracy || 0}%
- Слов изучено: ${langProgress?.wordsLearned || 0}
- Учебная серия: ${user?.streak || 0} дней
- Карточек к повторению сегодня: ${dueCards.length}

Правила форматирования ответов:
1. Не используй символы * ** для выделения текста — никогда.
2. Не используй маркированные списки со звёздочками. Для перечислений используй цифры (1. 2. 3.) или дефис (- ).
3. Пиши естественным живым языком, как опытный преподаватель.
4. Ответы должны быть структурированными, но читаемыми — используй абзацы и пустые строки между ними.
5. Если даёшь упражнение или пример — оформляй его отдельным абзацем с отступом.
6. Отвечай только на русском языке, если пользователь не попросил иначе.
7. Специализируйся на: произношении, грамматике, лексике, методиках запоминания, культурном контексте языка.
8. Будь кратким и конкретным — избегай воды и общих фраз.
9. Если пользователь хочет пройти тест, проверить знания или попрактиковаться — в конце ответа добавь маркер:
   - [TEST:/games/speed] — скоростной раунд
   - [TEST:/games/matching] — игра на соответствие
   - [TEST:/flashcards] — карточки для повторения
   - [TEST:/games] — раздел с играми
10. Если пользователь просит составить словарь — дай список слов в формате "слово — перевод" (по одной паре на строку) и добавь маркер [DICT:Название темы]`;



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
            { role: 'system', content: systemPrompt },
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
          const m = line.match(/^([\w\s]+)[\s]*[—\-–][\s]*(.+)$/);
          if (m) {
            dictWords.push({ term: m[1].trim(), translation: m[2].trim() });
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
            {QUICK_QUESTIONS.map(q => (
              <button key={q} className="quick-q" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          <div className="ai-input-area">
            <input
              className="ai-input"
              placeholder="Задайте вопрос тьютору..."
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
