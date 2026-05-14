import React, { useState } from 'react';
import {
  BookOpen, Plus, Edit3, Trash2, Search,
  FileText, Gamepad2, ShoppingCart, X
} from 'lucide-react';
import { useCourses, uuidv4 } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import {
  Course, Test, ManagedGame, CourseTier,
  TIER_CONFIG, LANGUAGE_NAMES, TestQuestion
} from '../types/courses';
import { LanguageCode, DifficultyLevel } from '../types/index';
import './ManagerPanel.css';

type Tab = 'courses' | 'tests' | 'games' | 'purchases';

const LANG_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: '🇬🇧 Английский' },
  { value: 'de', label: '🇩🇪 Немецкий' },
  { value: 'fr', label: '🇫🇷 Французский' },
  { value: 'es', label: '🇪🇸 Испанский' },
  { value: 'it', label: '🇮🇹 Итальянский' },
  { value: 'zh', label: '🇨🇳 Китайский' },
  { value: 'ja', label: '🇯🇵 Японский' },
  { value: 'pt', label: '🇧🇷 Португальский' },
];

const LEVEL_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'A1 — Начинающий' },
  { value: 'elementary', label: 'A2 — Элементарный' },
  { value: 'intermediate', label: 'B1 — Средний' },
  { value: 'upper-intermediate', label: 'B2 — Выше среднего' },
  { value: 'advanced', label: 'C1+ — Продвинутый' },
];

const EMOJI_OPTIONS = ['🇬🇧','🇩🇪','🇫🇷','🇪🇸','🇮🇹','🇨🇳','🇯🇵','🇧🇷','📘','📗','📙','📕','🌍','✈️','🎓','💬'];

// ─── CourseModal ──────────────────────────────────────────────────────────────
interface CourseModalProps {
  initial?: Course | null;
  onSave: (c: Course) => void;
  onClose: () => void;
  createdBy: string;
}

const CourseModal: React.FC<CourseModalProps> = ({ initial, onSave, onClose, createdBy }) => {
  const now = new Date().toISOString();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [language, setLanguage] = useState<LanguageCode>(initial?.language || 'en');
  const [level, setLevel] = useState<DifficultyLevel>(initial?.level || 'beginner');
  const [tier, setTier] = useState<CourseTier>(initial?.tier || 'standard');
  const [price, setPrice] = useState(String(initial?.price ?? 990));
  const [emoji, setEmoji] = useState(initial?.emoji || '📘');
  const [coverColor, setCoverColor] = useState(initial?.coverColor || '#3b82f6');
  const [status, setStatus] = useState<Course['status']>(initial?.status || 'draft');
  const [features, setFeatures] = useState((initial?.features || []).join('\n'));

  const handleSave = () => {
    if (!title.trim()) { alert('Введите название'); return; }
    const course: Course = {
      id: initial?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      language, level, tier,
      price: Number(price) || 0,
      status, coverColor, emoji,
      lessons: initial?.lessons || [],
      dictionaryIds: initial?.dictionaryIds || [],
      testIds: initial?.testIds || [],
      createdBy,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
      totalStudents: initial?.totalStudents || 0,
      rating: initial?.rating || 5.0,
      features: features.split('\n').map(f => f.trim()).filter(Boolean),
    };
    onSave(course);
  };

  return (
    <div className="mgr-modal-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <span className="mgr-modal-title">{initial ? 'Редактировать курс' : 'Создать курс'}</span>
          <button className="mgr-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mgr-modal-body">
          <div className="mgr-field">
            <label>Название курса *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Английский для начинающих" />
          </div>
          <div className="mgr-field">
            <label>Описание</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробное описание..." />
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Язык</label>
              <select value={language} onChange={e => setLanguage(e.target.value as LanguageCode)}>
                {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mgr-field">
              <label>Уровень</label>
              <select value={level} onChange={e => setLevel(e.target.value as DifficultyLevel)}>
                {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Тариф</label>
              <select value={tier} onChange={e => setTier(e.target.value as CourseTier)}>
                <option value="standard">📘 Standard</option>
                <option value="medium">📗 Medium</option>
                <option value="premium">⭐ Premium</option>
              </select>
            </div>
            <div className="mgr-field">
              <label>Цена (₽)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" />
            </div>
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Эмодзи</label>
              <select value={emoji} onChange={e => setEmoji(e.target.value)}>
                {EMOJI_OPTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div className="mgr-field">
              <label>Цвет обложки</label>
              <input type="color" value={coverColor} onChange={e => setCoverColor(e.target.value)} style={{ height: 38, cursor: 'pointer' }} />
            </div>
          </div>
          <div className="mgr-field">
            <label>Статус публикации</label>
            <select value={status} onChange={e => setStatus(e.target.value as Course['status'])}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
              <option value="archived">Архив</option>
            </select>
          </div>
          <div className="mgr-field">
            <label>Что включено (каждый пункт с новой строки)</label>
            <textarea rows={5} value={features} onChange={e => setFeatures(e.target.value)}
              placeholder={"500+ слов\n20 уроков\nФлеш-карточки\nТесты"} />
          </div>
        </div>
        <div className="mgr-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// ─── TestModal ────────────────────────────────────────────────────────────────
interface TestModalProps {
  initial?: Test | null;
  onSave: (t: Test) => void;
  onClose: () => void;
  createdBy: string;
}

const TestModal: React.FC<TestModalProps> = ({ initial, onSave, onClose, createdBy }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [language, setLanguage] = useState<LanguageCode>(initial?.language || 'en');
  const [level, setLevel] = useState<DifficultyLevel>(initial?.level || 'beginner');
  const [passingScore, setPassingScore] = useState(String(initial?.passingScore ?? 70));
  const [timeLimit, setTimeLimit] = useState(String(initial?.timeLimit ?? 15));
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [questions, setQuestions] = useState<TestQuestion[]>(initial?.questions || []);
  const [addingQ, setAddingQ] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<TestQuestion['type']>('multiple-choice');
  const [qOptions, setQOptions] = useState('');
  const [qAnswer, setQAnswer] = useState('');

  const addQuestion = () => {
    if (!qText.trim() || !qAnswer.trim()) return;
    const q: TestQuestion = {
      id: uuidv4(),
      question: qText.trim(),
      type: qType,
      options: qType === 'multiple-choice' ? qOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      correctAnswer: qAnswer.trim(),
    };
    setQuestions(prev => [...prev, q]);
    setQText(''); setQOptions(''); setQAnswer('');
    setAddingQ(false);
  };

  const handleSave = () => {
    if (!title.trim()) { alert('Введите название'); return; }
    const test: Test = {
      id: initial?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      language, level, questions,
      timeLimit: Number(timeLimit) || undefined,
      passingScore: Number(passingScore) || 70,
      isPublic, createdBy,
      createdAt: initial?.createdAt || new Date().toISOString(),
    };
    onSave(test);
  };

  return (
    <div className="mgr-modal-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <span className="mgr-modal-title">{initial ? 'Редактировать тест' : 'Создать тест'}</span>
          <button className="mgr-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mgr-modal-body">
          <div className="mgr-field">
            <label>Название теста *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Тест по базовой грамматике" />
          </div>
          <div className="mgr-field">
            <label>Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Краткое описание" />
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Язык</label>
              <select value={language} onChange={e => setLanguage(e.target.value as LanguageCode)}>
                {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mgr-field">
              <label>Уровень</label>
              <select value={level} onChange={e => setLevel(e.target.value as DifficultyLevel)}>
                {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Проходной балл (%)</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min="1" max="100" />
            </div>
            <div className="mgr-field">
              <label>Лимит времени (мин)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} min="1" />
            </div>
          </div>
          <div className="mgr-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
              Публичный тест (виден всем пользователям)
            </label>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>
              Вопросы ({questions.length})
            </div>
            <div className="questions-list">
              {questions.map((q, i) => (
                <div key={q.id} className="question-item">
                  <span className="question-item-num">#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div className="question-item-text">{q.question}</div>
                    <div className="question-item-type">
                      {q.type === 'multiple-choice' ? 'Выбор ответа' : q.type === 'typing' ? 'Ввод текста' : 'Да / Нет'}
                      {' · '}Ответ: <strong>{q.correctAnswer}</strong>
                    </div>
                  </div>
                  <button className="tbl-btn danger" onClick={() => setQuestions(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {addingQ ? (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="mgr-field">
                  <label>Вопрос *</label>
                  <input value={qText} onChange={e => setQText(e.target.value)} placeholder="Введите вопрос" />
                </div>
                <div className="mgr-field">
                  <label>Тип вопроса</label>
                  <select value={qType} onChange={e => setQType(e.target.value as TestQuestion['type'])}>
                    <option value="multiple-choice">Выбор ответа</option>
                    <option value="typing">Ввод текста</option>
                    <option value="true-false">Да / Нет</option>
                  </select>
                </div>
                {qType === 'multiple-choice' && (
                  <div className="mgr-field">
                    <label>Варианты ответов (через запятую)</label>
                    <input value={qOptions} onChange={e => setQOptions(e.target.value)} placeholder="Привет, Пока, Спасибо, Да" />
                  </div>
                )}
                <div className="mgr-field">
                  <label>Правильный ответ *</label>
                  <input value={qAnswer} onChange={e => setQAnswer(e.target.value)} placeholder="Правильный ответ" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-save" onClick={addQuestion}>Добавить</button>
                  <button className="btn-cancel" onClick={() => setAddingQ(false)}>Отмена</button>
                </div>
              </div>
            ) : (
              <button className="btn-add-question" style={{ marginTop: 10 }} onClick={() => setAddingQ(true)}>
                + Добавить вопрос
              </button>
            )}
          </div>
        </div>
        <div className="mgr-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// ─── GameModal ────────────────────────────────────────────────────────────────
interface GameModalProps {
  initial?: ManagedGame | null;
  onSave: (g: ManagedGame) => void;
  onClose: () => void;
  createdBy: string;
}

const GameModal: React.FC<GameModalProps> = ({ initial, onSave, onClose, createdBy }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [language, setLanguage] = useState<LanguageCode>(initial?.language || 'en');
  const [level, setLevel] = useState<DifficultyLevel>(initial?.level || 'beginner');
  const [type, setType] = useState<ManagedGame['type']>(initial?.type || 'matching');
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [wordPairs, setWordPairs] = useState<{ term: string; translation: string }[]>(
    initial?.wordPairs?.length ? initial.wordPairs : [{ term: '', translation: '' }]
  );

  const addPair = () => setWordPairs(p => [...p, { term: '', translation: '' }]);
  const removePair = (i: number) => setWordPairs(p => p.filter((_, j) => j !== i));
  const updatePair = (i: number, field: 'term' | 'translation', val: string) =>
    setWordPairs(p => p.map((pair, j) => j === i ? { ...pair, [field]: val } : pair));

  const handleSave = () => {
    if (!title.trim()) { alert('Введите название'); return; }
    const game: ManagedGame = {
      id: initial?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      language, level, type,
      wordPairs: wordPairs.filter(p => p.term.trim() && p.translation.trim()),
      isPublic, createdBy,
      createdAt: initial?.createdAt || new Date().toISOString(),
    };
    onSave(game);
  };

  return (
    <div className="mgr-modal-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <span className="mgr-modal-title">{initial ? 'Редактировать игру' : 'Создать игру'}</span>
          <button className="mgr-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mgr-modal-body">
          <div className="mgr-field">
            <label>Название игры *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Совпадение слов — Английский A1" />
          </div>
          <div className="mgr-field">
            <label>Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Краткое описание" />
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Тип игры</label>
              <select value={type} onChange={e => setType(e.target.value as ManagedGame['type'])}>
                <option value="matching">Совпадение (Matching)</option>
                <option value="speed">Быстрый раунд (Speed)</option>
                <option value="fill-blank">Заполни пропуск</option>
                <option value="word-order">Порядок слов</option>
              </select>
            </div>
            <div className="mgr-field">
              <label>Язык</label>
              <select value={language} onChange={e => setLanguage(e.target.value as LanguageCode)}>
                {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mgr-fields-row">
            <div className="mgr-field">
              <label>Уровень</label>
              <select value={level} onChange={e => setLevel(e.target.value as DifficultyLevel)}>
                {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mgr-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                Публичная игра
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>
              Пары слов ({wordPairs.filter(p => p.term && p.translation).length} заполнено)
            </div>
            <div className="word-pairs-list">
              {wordPairs.map((pair, i) => (
                <div key={i} className="word-pair-row">
                  <input value={pair.term} onChange={e => updatePair(i, 'term', e.target.value)} placeholder="Слово" />
                  <input value={pair.translation} onChange={e => updatePair(i, 'translation', e.target.value)} placeholder="Перевод" />
                  <button className="btn-remove-pair" onClick={() => removePair(i)}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn-add-question" style={{ marginTop: 10 }} onClick={addPair}>
              + Добавить пару
            </button>
          </div>
        </div>
        <div className="mgr-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// ─── ManagerPanel ─────────────────────────────────────────────────────────────
const ManagerPanel: React.FC = () => {
  const { state, dispatch } = useCourses();
  const { authState } = useAuth();
  const currentUser = authState.currentUser!;

  const [tab, setTab] = useState<Tab>('courses');
  const [search, setSearch] = useState('');
  const [courseModal, setCourseModal] = useState<{ open: boolean; item: Course | null }>({ open: false, item: null });
  const [testModal, setTestModal] = useState<{ open: boolean; item: Test | null }>({ open: false, item: null });
  const [gameModal, setGameModal] = useState<{ open: boolean; item: ManagedGame | null }>({ open: false, item: null });

  const pendingPurchases = state.purchases.filter(p => p.status === 'pending');
  const totalRevenue = state.purchases.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0);

  // ── Courses ──────────────────────────────────────
  const filteredCourses = state.courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    LANGUAGE_NAMES[c.language].toLowerCase().includes(search.toLowerCase())
  );

  const saveCourse = (course: Course) => {
    if (state.courses.find(c => c.id === course.id)) dispatch({ type: 'UPDATE_COURSE', payload: course });
    else dispatch({ type: 'ADD_COURSE', payload: course });
    setCourseModal({ open: false, item: null });
  };

  const deleteCourse = (id: string) => {
    if (window.confirm('Удалить курс? Это действие необратимо.')) dispatch({ type: 'DELETE_COURSE', payload: id });
  };

  const toggleCourseStatus = (course: Course) => {
    const nextStatus: Course['status'] = course.status === 'published' ? 'draft' : 'published';
    dispatch({ type: 'UPDATE_COURSE', payload: { ...course, status: nextStatus, updatedAt: new Date().toISOString() } });
  };

  // ── Tests ─────────────────────────────────────────
  const filteredTests = state.tests.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const saveTest = (test: Test) => {
    if (state.tests.find(t => t.id === test.id)) dispatch({ type: 'UPDATE_TEST', payload: test });
    else dispatch({ type: 'ADD_TEST', payload: test });
    setTestModal({ open: false, item: null });
  };

  const deleteTest = (id: string) => {
    if (window.confirm('Удалить тест?')) dispatch({ type: 'DELETE_TEST', payload: id });
  };

  // ── Games ─────────────────────────────────────────
  const filteredGames = state.games.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));

  const saveGame = (game: ManagedGame) => {
    if (state.games.find(g => g.id === game.id)) dispatch({ type: 'UPDATE_GAME', payload: game });
    else dispatch({ type: 'ADD_GAME', payload: game });
    setGameModal({ open: false, item: null });
  };

  const deleteGame = (id: string) => {
    if (window.confirm('Удалить игру?')) dispatch({ type: 'DELETE_GAME', payload: id });
  };

  // ── Purchases ─────────────────────────────────────
  const confirmPurchase = (id: string) => dispatch({ type: 'UPDATE_PURCHASE_STATUS', payload: { id, status: 'confirmed' } });
  const rejectPurchase = (id: string) => dispatch({ type: 'UPDATE_PURCHASE_STATUS', payload: { id, status: 'rejected' } });

  const filteredPurchases = state.purchases.filter(p => {
    if (!search) return true;
    const course = state.courses.find(c => c.id === p.courseId);
    return (course?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      p.payerName.toLowerCase().includes(search.toLowerCase()) ||
      p.payerEmail.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="manager-panel">
      <div className="manager-header">
        <div>
          <div className="manager-title">Панель менеджера</div>
          <div className="manager-subtitle">Управление курсами, тестами, играми и заказами</div>
        </div>
      </div>

      {/* Stats */}
      <div className="manager-stats">
        <div className="manager-stat-card">
          <div className="manager-stat-value">{state.courses.filter(c => c.status === 'published').length}</div>
          <div className="manager-stat-label">Активных курсов</div>
        </div>
        <div className="manager-stat-card">
          <div className="manager-stat-value">{state.tests.length}</div>
          <div className="manager-stat-label">Тестов создано</div>
        </div>
        <div className="manager-stat-card">
          <div className="manager-stat-value" style={{ color: '#fbbf24' }}>{pendingPurchases.length}</div>
          <div className="manager-stat-label">Ждут подтверждения</div>
        </div>
        <div className="manager-stat-card">
          <div className="manager-stat-value" style={{ color: '#34d399' }}>{totalRevenue.toLocaleString('ru-RU')} ₽</div>
          <div className="manager-stat-label">Выручка (подтверждено)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="manager-tabs">
        {([
          { key: 'courses' as Tab, label: 'Курсы', icon: <BookOpen size={14} />, count: state.courses.length },
          { key: 'tests' as Tab, label: 'Тесты', icon: <FileText size={14} />, count: state.tests.length },
          { key: 'games' as Tab, label: 'Игры', icon: <Gamepad2 size={14} />, count: state.games.length },
          { key: 'purchases' as Tab, label: 'Заказы', icon: <ShoppingCart size={14} />, count: pendingPurchases.length },
        ]).map(t => (
          <button
            key={t.key}
            className={`manager-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => { setTab(t.key); setSearch(''); }}
          >
            {t.icon} {t.label}
            {t.count > 0 && <span className="manager-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── COURSES ──────────────────────────────────────── */}
      {tab === 'courses' && (
        <>
          <div className="manager-toolbar">
            <div className="manager-search">
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по курсам..." />
            </div>
            <button className="btn-add" onClick={() => setCourseModal({ open: true, item: null })}>
              <Plus size={15} /> Новый курс
            </button>
          </div>
          <table className="manager-table">
            <thead>
              <tr>
                <th>Курс</th>
                <th>Язык</th>
                <th>Тариф</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Студентов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{c.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.level}</div>
                      </div>
                    </div>
                  </td>
                  <td>{LANGUAGE_NAMES[c.language]}</td>
                  <td>
                    <span style={{ color: TIER_CONFIG[c.tier].color, fontWeight: 700, fontSize: 12 }}>
                      {TIER_CONFIG[c.tier].emoji} {TIER_CONFIG[c.tier].label}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.price.toLocaleString('ru-RU')} ₽</td>
                  <td>
                    <span className={`status-badge ${c.status}`}>
                      {c.status === 'published' ? 'Опубликован' : c.status === 'draft' ? 'Черновик' : 'Архив'}
                    </span>
                  </td>
                  <td>{c.totalStudents}</td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn" title={c.status === 'published' ? 'Снять с публикации' : 'Опубликовать'} onClick={() => toggleCourseStatus(c)}>
                        {c.status === 'published' ? '📴' : '📢'}
                      </button>
                      <button className="tbl-btn" onClick={() => setCourseModal({ open: true, item: c })}>
                        <Edit3 size={12} />
                      </button>
                      <button className="tbl-btn danger" onClick={() => deleteCourse(c.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    Курсов не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── TESTS ────────────────────────────────────────── */}
      {tab === 'tests' && (
        <>
          <div className="manager-toolbar">
            <div className="manager-search">
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по тестам..." />
            </div>
            <button className="btn-add" onClick={() => setTestModal({ open: true, item: null })}>
              <Plus size={15} /> Новый тест
            </button>
          </div>
          {filteredTests.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">📝</div>
              <div className="empty-tab-title">Тестов пока нет</div>
              <div className="empty-tab-desc">Создайте первый тест для проверки знаний студентов</div>
            </div>
          ) : (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Язык</th>
                  <th>Уровень</th>
                  <th>Вопросов</th>
                  <th>Время (мин)</th>
                  <th>Доступность</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{LANGUAGE_NAMES[t.language]}</td>
                    <td>{t.level}</td>
                    <td>{t.questions.length}</td>
                    <td>{t.timeLimit ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${t.isPublic ? 'public' : 'private'}`}>
                        {t.isPublic ? 'Публичный' : 'Приватный'}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="tbl-btn" onClick={() => setTestModal({ open: true, item: t })}>
                          <Edit3 size={12} />
                        </button>
                        <button className="tbl-btn danger" onClick={() => deleteTest(t.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── GAMES ────────────────────────────────────────── */}
      {tab === 'games' && (
        <>
          <div className="manager-toolbar">
            <div className="manager-search">
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по играм..." />
            </div>
            <button className="btn-add" onClick={() => setGameModal({ open: true, item: null })}>
              <Plus size={15} /> Новая игра
            </button>
          </div>
          {filteredGames.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">🎮</div>
              <div className="empty-tab-title">Игр пока нет</div>
              <div className="empty-tab-desc">Создайте игру с набором слов для ваших студентов</div>
            </div>
          ) : (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Язык</th>
                  <th>Уровень</th>
                  <th>Пар слов</th>
                  <th>Доступность</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{g.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.type}</td>
                    <td>{LANGUAGE_NAMES[g.language]}</td>
                    <td>{g.level}</td>
                    <td>{g.wordPairs?.length || 0}</td>
                    <td>
                      <span className={`status-badge ${g.isPublic ? 'public' : 'private'}`}>
                        {g.isPublic ? 'Публичная' : 'Приватная'}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="tbl-btn" onClick={() => setGameModal({ open: true, item: g })}>
                          <Edit3 size={12} />
                        </button>
                        <button className="tbl-btn danger" onClick={() => deleteGame(g.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── PURCHASES ────────────────────────────────────── */}
      {tab === 'purchases' && (
        <>
          <div className="manager-toolbar">
            <div className="manager-search">
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по заказам..." />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Всего заказов: {state.purchases.length} · Ожидают: {pendingPurchases.length}
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">🛒</div>
              <div className="empty-tab-title">Заказов пока нет</div>
              <div className="empty-tab-desc">Здесь появятся заявки на покупку курсов</div>
            </div>
          ) : (
            <div className="purchases-list">
              {filteredPurchases.map(p => {
                const course = state.courses.find(c => c.id === p.courseId);
                return (
                  <div key={p.id} className="purchase-card">
                    <div style={{ fontSize: 28 }}>{course?.emoji || '📘'}</div>
                    <div className="purchase-info">
                      <div className="purchase-course">{course?.title || 'Неизвестный курс'}</div>
                      <div className="purchase-meta">
                        <span>{p.payerName}</span>
                        <span>·</span>
                        <span>{p.payerEmail}</span>
                        <span>·</span>
                        <span>Карта *{p.cardLastFour}</span>
                        <span>·</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <div className="purchase-amount">{p.amount.toLocaleString('ru-RU')} ₽</div>
                      <span className={`status-badge ${p.status}`}>
                        {p.status === 'pending' ? 'Ожидает' : p.status === 'confirmed' ? 'Подтверждён' : 'Отклонён'}
                      </span>
                    </div>
                    {p.status === 'pending' && (
                      <div className="purchase-actions">
                        <button className="btn-confirm" onClick={() => confirmPurchase(p.id)}>✓ Подтвердить</button>
                        <button className="btn-reject" onClick={() => rejectPurchase(p.id)}>✕ Отклонить</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {courseModal.open && (
        <CourseModal
          initial={courseModal.item}
          onSave={saveCourse}
          onClose={() => setCourseModal({ open: false, item: null })}
          createdBy={currentUser.id}
        />
      )}
      {testModal.open && (
        <TestModal
          initial={testModal.item}
          onSave={saveTest}
          onClose={() => setTestModal({ open: false, item: null })}
          createdBy={currentUser.id}
        />
      )}
      {gameModal.open && (
        <GameModal
          initial={gameModal.item}
          onSave={saveGame}
          onClose={() => setGameModal({ open: false, item: null })}
          createdBy={currentUser.id}
        />
      )}
    </div>
  );
};

export default ManagerPanel;
