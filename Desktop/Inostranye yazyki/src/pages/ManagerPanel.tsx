import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit3, Trash2, Search,
  FileText, Gamepad2, ShoppingCart, X,
  Download, Upload, Users, BarChart3, Shield,
  Copy, Mail, Tag, ClipboardList, Eye, CheckSquare, Square, Send
} from 'lucide-react';
import { useCourses, uuidv4 } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import {
  Course, Test, ManagedGame, CourseTier,
  TIER_CONFIG, LANGUAGE_NAMES, TestQuestion
} from '../types/courses';
import { LanguageCode, DifficultyLevel } from '../types/index';
import './ManagerPanel.css';

type Tab = 'courses' | 'tests' | 'games' | 'purchases' | 'users' | 'reports' | 'promocodes' | 'broadcast' | 'audit';

const LANG_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: '🇬🇧 Английский' },
  { value: 'fr', label: '🇫🇷 Французский' },
  { value: 'zh', label: '🇨🇳 Китайский' },
];

const LEVEL_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'A1 — Начинающий' },
  { value: 'elementary', label: 'A2 — Элементарный' },
  { value: 'intermediate', label: 'B1 — Средний' },
  { value: 'upper-intermediate', label: 'B2 — Выше среднего' },
  { value: 'advanced', label: 'C1+ — Продвинутый' },
];

const EMOJI_OPTIONS = ['🇬🇧','🇫🇷','🇳','📘','📗','📙','📕','🌍','✈️','🎓','💬'];

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

// ─── AiCourseModal ────────────────────────────────────────────────────────────
interface AiCourseModalProps {
  onClose: () => void;
  onGenerate: (topic: string, language: LanguageCode, level: DifficultyLevel, tier: CourseTier, lessonCount: number) => void;
  loading: boolean;
}

const AiCourseModal: React.FC<AiCourseModalProps> = ({ onClose, onGenerate, loading }) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [level, setLevel] = useState<DifficultyLevel>('beginner');
  const [tier, setTier] = useState<CourseTier>('standard');
  const [lessonCount, setLessonCount] = useState(5);

  return (
    <div className="mgr-modal-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <span className="mgr-modal-title">🤖 Сгенерировать курс AI</span>
          <button className="mgr-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mgr-modal-body">
          <div className="form-group">
            <label>Тема курса</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Например: Английский для путешествий" />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Язык</label>
              <select value={language} onChange={e => setLanguage(e.target.value as LanguageCode)}>
                {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Уровень</label>
              <select value={level} onChange={e => setLevel(e.target.value as DifficultyLevel)}>
                {LEVEL_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Тариф</label>
              <select value={tier} onChange={e => setTier(e.target.value as CourseTier)}>
                <option value="standard">Standard</option>
                <option value="medium">Medium</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="form-group">
              <label>Кол-во уроков</label>
              <input type="number" min={3} max={20} value={lessonCount} onChange={e => setLessonCount(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="mgr-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" disabled={!topic || loading} onClick={() => onGenerate(topic, language, level, tier, lessonCount)}>
            {loading ? 'Генерация...' : '🤖 Сгенерировать'}
          </button>
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
  const [aiCourseModal, setAiCourseModal] = useState(false);
  const [aiCourseLoading, setAiCourseLoading] = useState(false);
  const [testModal, setTestModal] = useState<{ open: boolean; item: Test | null }>({ open: false, item: null });
  const [gameModal, setGameModal] = useState<{ open: boolean; item: ManagedGame | null }>({ open: false, item: null });
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  // bulk actions
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  // promocodes
  const [promocodes, setPromocodes] = useState<any[]>([]);
  const [promoModal, setPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discount_percent: '', discount_amount: '', max_uses: '', expires_at: '', applicable_tiers: 'all', is_active: true });
  // broadcast
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastHtml, setBroadcastHtml] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastSending, setBroadcastSending] = useState(false);
  // audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  // user detail
  const [userDetail, setUserDetail] = useState<any>(null);

  const isAdmin = currentUser?.role === 'admin';

  // ── Load users & reports ─────────────────────────
  useEffect(() => {
    if (tab === 'users' && isAdmin) {
      fetch('/api/users')
        .then(r => r.json())
        .then(d => { if (d.success) setUsers(d.users); })
        .catch(console.error);
    }
    if (tab === 'reports' && isAdmin) {
      fetch('/api/users/stats/dashboard')
        .then(r => r.json())
        .then(d => { if (d.success) setReports(d.stats); })
        .catch(console.error);
    }
    if (tab === 'promocodes' && isAdmin) {
      fetch('/api/promocodes')
        .then(r => r.json())
        .then(d => { if (d.success) setPromocodes(d.promocodes); })
        .catch(console.error);
    }
    if (tab === 'audit' && isAdmin) {
      fetch('/api/audit')
        .then(r => r.json())
        .then(d => { if (d.success) setAuditLogs(d.logs); })
        .catch(console.error);
      fetch('/api/audit/stats')
        .then(r => r.json())
        .then(d => { if (d.success) setAuditStats(d); })
        .catch(console.error);
    }
  }, [tab, isAdmin]);

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

  const handleAiCourseGenerate = async (topic: string, language: LanguageCode, level: DifficultyLevel, tier: CourseTier, lessonCount: number) => {
    setAiCourseLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Ты — генератор образовательных курсов для LinguaAI. Отвечай ТОЛЬКО JSON объектом, без markdown, без комментариев, без слов вне JSON.
Создай курс по теме "${topic}" для языка ${language}, уровень ${level}, ${lessonCount} уроков.
JSON формат:
{
  "title": "Название курса",
  "description": "Описание курса 1-2 предложения",
  "emoji": "emoji флага",
  "coverColor": "hex цвет",
  "price": число,
  "features": ["фича 1", "фича 2", ...],
  "lessons": [
    { "title": "Название урока", "description": "Короткое описание", "content": "Содержание урока (3-5 предложений)" }
  ]
}`,
            },
            { role: 'user', content: `Сгенерируй курс: ${topic}` },
          ],
        }),
      });
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || '';
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const newCourse: Course = {
        id: uuidv4(),
        title: parsed.title || topic,
        description: parsed.description || `Курс по теме "${topic}"`,
        language,
        level,
        tier,
        price: parsed.price || (tier === 'standard' ? 990 : tier === 'medium' ? 1990 : 4990),
        status: 'draft',
        coverColor: parsed.coverColor || '#4a6cf7',
        emoji: parsed.emoji || '🌍',
        features: parsed.features || [`${lessonCount} уроков`, 'Флеш-карточки'],
        lessons: (parsed.lessons || []).map((l: any, i: number) => ({
          id: uuidv4(),
          title: l.title || `Урок ${i + 1}`,
          description: l.description || '',
          content: l.content || '',
          order: i + 1,
        })),
        dictionaryIds: [],
        testIds: [],
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalStudents: 0,
        rating: 0,
      };

      dispatch({ type: 'ADD_COURSE', payload: newCourse });
      setAiCourseModal(false);
    } catch (err) {
      console.error('AI course generation error:', err);
      alert('Не удалось сгенерировать курс. Попробуйте ещё раз.');
    } finally {
      setAiCourseLoading(false);
    }
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

  // ── Export / Import ────────────────────────────────
  const exportCsv = (endpoint: string, filename: string) => {
    fetch(`/api/export/${endpoint}`)
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const importCourses = async () => {
    try {
      const data = JSON.parse(importText);
      const courses = Array.isArray(data) ? data : data.courses;
      const res = await fetch('/api/import/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses, created_by: currentUser.id }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Импортировано ${json.count} курсов`);
        json.courses.forEach((c: Course) => dispatch({ type: 'ADD_COURSE', payload: c }));
        setImportModal(false);
        setImportText('');
      } else {
        alert('Ошибка импорта: ' + (json.error || 'unknown'));
      }
    } catch (e) {
      alert('Неверный JSON: ' + (e as Error).message);
    }
  };

  // ── Users ──────────────────────────────────────────
  const updateUserRole = async (id: string, role: string) => {
    await fetch(`/api/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const toggleUserActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/users/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: isActive }) });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: isActive } : u));
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Удалить пользователя? Это необратимо.')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ── Bulk actions ─────────────────────────────────
  const toggleSelectCourse = (id: string) => {
    setSelectedCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllCourses = () => {
    if (selectedCourseIds.size === filteredCourses.length) setSelectedCourseIds(new Set());
    else setSelectedCourseIds(new Set(filteredCourses.map(c => c.id)));
  };
  const bulkDeleteCourses = async () => {
    if (!window.confirm(`Удалить ${selectedCourseIds.size} курсов?`)) return;
    await fetch('/api/courses/bulk/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedCourseIds) }) });
    selectedCourseIds.forEach(id => dispatch({ type: 'DELETE_COURSE', payload: id }));
    setSelectedCourseIds(new Set());
  };
  const bulkStatusCourses = async (status: string) => {
    await fetch('/api/courses/bulk/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedCourseIds), status }) });
    selectedCourseIds.forEach(id => {
      const c = state.courses.find(x => x.id === id);
      if (c) dispatch({ type: 'UPDATE_COURSE', payload: { ...c, status: status as any } });
    });
    setSelectedCourseIds(new Set());
  };
  const duplicateCourse = async (id: string) => {
    const res = await fetch(`/api/courses/${id}/duplicate`, { method: 'POST' });
    const json = await res.json();
    if (json.success) dispatch({ type: 'ADD_COURSE', payload: json.course });
  };

  // ── Promocodes ─────────────────────────────────────
  const savePromocode = async () => {
    const body = {
      code: promoForm.code,
      discount_percent: promoForm.discount_percent ? parseInt(promoForm.discount_percent) : null,
      discount_amount: promoForm.discount_amount ? parseInt(promoForm.discount_amount) : null,
      max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
      expires_at: promoForm.expires_at || null,
      applicable_tiers: promoForm.applicable_tiers === 'all' ? null : [promoForm.applicable_tiers],
      is_active: promoForm.is_active,
    };
    const res = await fetch('/api/promocodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (json.success) { setPromocodes(prev => [json.promocode, ...prev]); setPromoModal(false); setPromoForm({ code: '', discount_percent: '', discount_amount: '', max_uses: '', expires_at: '', applicable_tiers: 'all', is_active: true }); }
    else alert(json.error);
  };
  const togglePromo = async (id: string, isActive: boolean) => {
    await fetch(`/api/promocodes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: isActive }) });
    setPromocodes(prev => prev.map(p => p.id === id ? { ...p, is_active: isActive } : p));
  };
  const deletePromo = async (id: string) => {
    if (!window.confirm('Удалить промокод?')) return;
    await fetch(`/api/promocodes/${id}`, { method: 'DELETE' });
    setPromocodes(prev => prev.filter(p => p.id !== id));
  };

  // ── Broadcast ──────────────────────────────────────
  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastHtml.trim()) return;
    setBroadcastSending(true);
    const res = await fetch('/api/broadcast/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: broadcastSubject, html: broadcastHtml, target: broadcastTarget }),
    });
    const json = await res.json();
    setBroadcastSending(false);
    if (json.success) alert(`Отправлено ${json.sent} из ${json.total}`);
    else alert('Ошибка: ' + json.error);
  };

  // ── User detail ────────────────────────────────────
  const openUserDetail = (u: any) => {
    const userPurchases = state.purchases.filter(p => p.userId === u.id);
    const userCourses = state.courses.filter(c => userPurchases.some(p => p.courseId === c.id && p.status === 'confirmed'));
    setUserDetail({ ...u, purchases: userPurchases, courses: userCourses });
  };

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
          ...(isAdmin ? [
            { key: 'users' as Tab, label: 'Пользователи', icon: <Users size={14} />, count: users.length },
            { key: 'reports' as Tab, label: 'Отчёты', icon: <BarChart3 size={14} />, count: 0 },
            { key: 'promocodes' as Tab, label: 'Промокоды', icon: <Tag size={14} />, count: promocodes.length },
            { key: 'broadcast' as Tab, label: 'Рассылка', icon: <Mail size={14} />, count: 0 },
            { key: 'audit' as Tab, label: 'Журнал', icon: <ClipboardList size={14} />, count: auditLogs.length },
          ] : []),
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
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedCourseIds.size > 0 && (
                <>
                  <button className="btn-export" onClick={() => bulkStatusCourses('published')}>✓ Опубликовать</button>
                  <button className="btn-export" onClick={() => bulkStatusCourses('draft')}>⏸ В черновик</button>
                  <button className="btn-export" onClick={() => bulkStatusCourses('archived')}>🗃 Архив</button>
                  <button className="btn-export danger" style={{ borderColor: '#ef4444', color: '#f87171' }} onClick={bulkDeleteCourses}><Trash2 size={12} /> Удалить</button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{selectedCourseIds.size} выбрано</span>
                </>
              )}
              <button className="btn-export" onClick={() => exportCsv('courses/csv', 'courses.csv')} title="Экспорт CSV">
                <Download size={14} /> CSV
              </button>
              <button className="btn-import" onClick={() => setImportModal(true)} title="Импорт JSON">
                <Upload size={14} /> Импорт
              </button>
              <button className="btn-add ai-gen-btn" onClick={() => setAiCourseModal(true)}>
                <span>🤖</span> AI курс
              </button>
              <button className="btn-add" onClick={() => setCourseModal({ open: true, item: null })}>
                <Plus size={15} /> Новый курс
              </button>
            </div>
          </div>
          <table className="manager-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button className="tbl-btn" onClick={selectAllCourses} style={{ padding: 4 }}>
                    {selectedCourseIds.size === filteredCourses.length && filteredCourses.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                </th>
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
                    <button className="tbl-btn" onClick={() => toggleSelectCourse(c.id)} style={{ padding: 4 }}>
                      {selectedCourseIds.has(c.id) ? <CheckSquare size={14} color="#6366f1" /> : <Square size={14} />}
                    </button>
                  </td>
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
                      <button className="tbl-btn" title="Дублировать" onClick={() => duplicateCourse(c.id)}>
                        <Copy size={12} />
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
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-export" onClick={() => {
                const headers = ['id','title','language','level','questions_count','timeLimit','isPublic'];
                const rows = state.tests.map(t => [t.id, t.title, t.language, t.level, t.questions.length, t.timeLimit ?? '', t.isPublic].join(';'));
                const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'tests.csv'; a.click(); URL.revokeObjectURL(url);
              }}>
                <Download size={14} /> CSV
              </button>
              <button className="btn-add" onClick={() => setTestModal({ open: true, item: null })}>
                <Plus size={15} /> Новый тест
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-export" onClick={() => {
                const headers = ['id','title','type','language','level','wordPairs','isPublic'];
                const rows = state.games.map(g => [g.id, g.title, g.type, g.language, g.level, g.wordPairs?.length || 0, g.isPublic].join(';'));
                const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'games.csv'; a.click(); URL.revokeObjectURL(url);
              }}>
                <Download size={14} /> CSV
              </button>
              <button className="btn-add" onClick={() => setGameModal({ open: true, item: null })}>
                <Plus size={15} /> Новая игра
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-export" onClick={() => exportCsv('purchases/csv', 'purchases.csv')}>
                <Download size={14} /> CSV
              </button>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Всего: {state.purchases.length} · Ожидают: {pendingPurchases.length}
              </div>
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

      {/* ── USERS (admin only) ───────────────────────────── */}
      {tab === 'users' && isAdmin && (
        <>
          <div className="manager-toolbar">
            <div className="manager-search">
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по пользователям..." />
            </div>
            <button className="btn-export" onClick={() => exportCsv('users/csv', 'users.csv')}>
              <Download size={14} /> CSV
            </button>
          </div>
          {users.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">👤</div>
              <div className="empty-tab-title">Нет данных</div>
            </div>
          ) : (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Активен</th>
                  <th>XP</th>
                  <th>Streak</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => (u.name + u.email).toLowerCase().includes(search.toLowerCase())).map(u => (
                  <tr key={u.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{u.avatar || '👤'}</span>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="user-role-select"
                        value={u.role}
                        onChange={e => updateUserRole(u.id, e.target.value)}
                      >
                        <option value="guest">Гость</option>
                        <option value="user">Пользователь</option>
                        <option value="manager">Менеджер</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="tbl-btn"
                        onClick={() => toggleUserActive(u.id, !u.is_active)}
                        title={u.is_active ? 'Заблокировать' : 'Разблокировать'}
                      >
                        <span className={`user-active-dot ${u.is_active ? 'active' : 'inactive'}`} />
                        {u.is_active ? 'Да' : 'Нет'}
                      </button>
                    </td>
                    <td>{u.total_xp}</td>
                    <td>{u.streak}</td>
                    <td>
                      <div className="tbl-actions">
                        <button className="tbl-btn" onClick={() => openUserDetail(u)} title="Детали">
                          <Eye size={12} />
                        </button>
                        <button className="tbl-btn danger" onClick={() => deleteUser(u.id)}>
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

      {/* ── REPORTS (admin only) ─────────────────────────── */}
      {tab === 'reports' && isAdmin && (
        <>
          <div className="manager-toolbar">
            <div style={{ fontSize: 16, fontWeight: 700 }}>📊 Сводная статистика</div>
            <button className="btn-export" onClick={() => exportCsv('stats/csv', 'stats.csv')}>
              <Download size={14} /> CSV
            </button>
          </div>

          {reports && (
            <>
              <div className="reports-grid">
                <div className="report-card">
                  <div className="report-card-value">{reports.usersTotal}</div>
                  <div className="report-card-label">Всего пользователей</div>
                  <div className="report-card-delta up">+{reports.usersToday} сегодня</div>
                </div>
                <div className="report-card">
                  <div className="report-card-value">{reports.activeNow}</div>
                  <div className="report-card-label">Активны за 24ч</div>
                </div>
                <div className="report-card">
                  <div className="report-card-value">{reports.coursesTotal}</div>
                  <div className="report-card-label">Всего курсов</div>
                </div>
                <div className="report-card">
                  <div className="report-card-value">{reports.purchasesTotal}</div>
                  <div className="report-card-label">Покупок</div>
                </div>
                <div className="report-card">
                  <div className="report-card-value">{reports.revenue.toLocaleString('ru-RU')} ₽</div>
                  <div className="report-card-label">Выручка</div>
                </div>
              </div>

              {/* Course popularity chart */}
              <div className="chart-section">
                <div className="chart-title">🔥 Популярность курсов (по студентам)</div>
                <div className="bar-chart">
                  {state.courses
                    .filter(c => c.totalStudents > 0)
                    .sort((a, b) => b.totalStudents - a.totalStudents)
                    .slice(0, 8)
                    .map(c => {
                      const max = Math.max(...state.courses.map(x => x.totalStudents), 1);
                      const pct = Math.round((c.totalStudents / max) * 100);
                      return (
                        <div key={c.id} className="bar-row">
                          <div className="bar-label">{c.emoji} {c.title.slice(0, 18)}</div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${pct}%`, background: c.coverColor || '#6366f1' }}>
                              <span>{c.totalStudents}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {state.courses.filter(c => c.totalStudents > 0).length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                      Нет данных о студентах
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue by tier */}
              <div className="chart-section">
                <div className="chart-title">💰 Выручка по тарифам</div>
                <div className="bar-chart">
                  {(['standard', 'medium', 'premium'] as const).map(tier => {
                    const revenue = state.purchases
                      .filter(p => p.status === 'confirmed' && p.tier === tier)
                      .reduce((s, p) => s + p.amount, 0);
                    const max = Math.max(
                      ...(['standard', 'medium', 'premium'] as const).map(t =>
                        state.purchases.filter(p => p.status === 'confirmed' && p.tier === t).reduce((s, p) => s + p.amount, 0)
                      ),
                      1
                    );
                    const pct = Math.round((revenue / max) * 100);
                    const color = tier === 'standard' ? '#3b82f6' : tier === 'medium' ? '#8b5cf6' : '#f59e0b';
                    return (
                      <div key={tier} className="bar-row">
                        <div className="bar-label">{TIER_CONFIG[tier].label}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: color }}>
                            <span>{revenue.toLocaleString('ru-RU')} ₽</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Import Modal ───────────────────────────────────── */}
      {importModal && (
        <div className="mgr-modal-overlay" onClick={() => setImportModal(false)}>
          <div className="mgr-modal" onClick={e => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">📥 Импорт курсов (JSON)</span>
              <button className="mgr-modal-close" onClick={() => setImportModal(false)}><X size={16} /></button>
            </div>
            <div className="mgr-modal-body">
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Вставьте JSON-массив курсов. Каждый объект должен содержать: title, description, language, level, tier, price, cover_color, emoji, features[]
              </div>
              <textarea
                className="import-textarea"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`[\n  {\n    "title": "Английский для путешествий",\n    "description": "Курс",\n    "language": "en",\n    "level": "beginner",\n    "tier": "standard",\n    "price": 990,\n    "cover_color": "#3b82f6",\n    "emoji": "🇬🇧",\n    "features": ["10 уроков", "Флеш-карточки"]\n  }\n]`}
              />
            </div>
            <div className="mgr-modal-footer">
              <button className="btn-cancel" onClick={() => setImportModal(false)}>Отмена</button>
              <button className="btn-save" onClick={importCourses} disabled={!importText.trim()}>
                <Upload size={14} /> Импортировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMOCODES (admin only) ─────────────────────── */}
      {tab === 'promocodes' && isAdmin && (
        <>
          <div className="manager-toolbar">
            <div style={{ fontSize: 16, fontWeight: 700 }}>🏷 Промокоды</div>
            <button className="btn-add" onClick={() => setPromoModal(true)}>
              <Plus size={15} /> Новый промокод
            </button>
          </div>
          {promocodes.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">🏷</div>
              <div className="empty-tab-title">Промокодов нет</div>
              <div className="empty-tab-desc">Создайте промокоды для скидок</div>
            </div>
          ) : (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Скидка</th>
                  <th>Использовано</th>
                  <th>Лимит</th>
                  <th>Истекает</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {promocodes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14 }}>{p.code}</td>
                    <td>
                      {p.discount_percent ? `${p.discount_percent}%` : p.discount_amount ? `${p.discount_amount} ₽` : '—'}
                    </td>
                    <td>{p.used_count || 0}</td>
                    <td>{p.max_uses || '∞'}</td>
                    <td>{p.expires_at ? new Date(p.expires_at).toLocaleDateString('ru-RU') : 'Нет'}</td>
                    <td>
                      <button className="tbl-btn" onClick={() => togglePromo(p.id, !p.is_active)}>
                        <span className={`user-active-dot ${p.is_active ? 'active' : 'inactive'}`} />
                        {p.is_active ? 'Активен' : 'Выключен'}
                      </button>
                    </td>
                    <td>
                      <button className="tbl-btn danger" onClick={() => deletePromo(p.id)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── BROADCAST (admin only) ───────────────────────── */}
      {tab === 'broadcast' && isAdmin && (
        <>
          <div className="manager-toolbar">
            <div style={{ fontSize: 16, fontWeight: 700 }}>📧 Email-рассылка</div>
          </div>
          <div className="chart-section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="mgr-field">
              <label>Получатели</label>
              <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                <option value="all">Все активные пользователи</option>
                <option value="admins">Только админы</option>
                <option value="managers">Только менеджеры</option>
              </select>
            </div>
            <div className="mgr-field">
              <label>Тема письма</label>
              <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder="Например: Новый курс уже доступен!" />
            </div>
            <div className="mgr-field">
              <label>HTML-содержимое</label>
              <textarea
                value={broadcastHtml}
                onChange={e => setBroadcastHtml(e.target.value)}
                placeholder="<h1>Привет!</h1><p>У нас отличные новости...</p>"
                style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
            <div>
              <button className="btn-save" onClick={sendBroadcast} disabled={broadcastSending || !broadcastSubject.trim() || !broadcastHtml.trim()}>
                <Send size={14} /> {broadcastSending ? 'Отправка...' : 'Разослать'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── AUDIT (admin only) ───────────────────────────── */}
      {tab === 'audit' && isAdmin && (
        <>
          <div className="manager-toolbar">
            <div style={{ fontSize: 16, fontWeight: 700 }}>📋 Журнал активности</div>
          </div>
          {auditStats && auditStats.byDay && (
            <div className="chart-section" style={{ marginBottom: 16 }}>
              <div className="chart-title">Активность по дням (7 дней)</div>
              <div className="bar-chart">
                {auditStats.byDay.map((d: any) => {
                  const max = Math.max(...auditStats.byDay.map((x: any) => parseInt(x.count)), 1);
                  const pct = Math.round((parseInt(d.count) / max) * 100);
                  return (
                    <div key={d.day} className="bar-row">
                      <div className="bar-label">{new Date(d.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: '#6366f1' }}>
                          <span>{d.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {auditLogs.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-icon">📋</div>
              <div className="empty-tab-title">Журнал пуст</div>
            </div>
          ) : (
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Пользователь</th>
                  <th>Действие</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                    <td>{log.user_name || '—'} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({log.user_email || 'system'})</span></td>
                    <td><span className="status-badge public">{log.action}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── User Detail Modal ────────────────────────────── */}
      {userDetail && (
        <div className="mgr-modal-overlay" onClick={() => setUserDetail(null)}>
          <div className="mgr-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">👤 {userDetail.name}</span>
              <button className="mgr-modal-close" onClick={() => setUserDetail(null)}><X size={16} /></button>
            </div>
            <div className="mgr-modal-body" style={{ gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="report-card" style={{ padding: 12 }}>
                  <div className="report-card-value" style={{ fontSize: 20 }}>{userDetail.total_xp}</div>
                  <div className="report-card-label">XP</div>
                </div>
                <div className="report-card" style={{ padding: 12 }}>
                  <div className="report-card-value" style={{ fontSize: 20 }}>{userDetail.streak}</div>
                  <div className="report-card-label">Streak</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                <div><strong>Email:</strong> {userDetail.email}</div>
                <div><strong>Роль:</strong> {userDetail.role}</div>
                <div><strong>Активен:</strong> {userDetail.is_active ? 'Да' : 'Нет'}</div>
                <div><strong>Дата регистрации:</strong> {userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('ru-RU') : '—'}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>📚 Курсы ({userDetail.courses?.length || 0})</div>
              {userDetail.courses?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет приобретённых курсов</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userDetail.courses.map((c: Course) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{c.language}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>🛒 Покупки ({userDetail.purchases?.length || 0})</div>
              {userDetail.purchases?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет покупок</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userDetail.purchases.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.amount?.toLocaleString('ru-RU')} ₽</span>
                      <span className={`status-badge ${p.status}`}>{p.status}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mgr-modal-footer">
              <button className="btn-cancel" onClick={() => setUserDetail(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Promo Modal ──────────────────────────────────── */}
      {promoModal && (
        <div className="mgr-modal-overlay" onClick={() => setPromoModal(false)}>
          <div className="mgr-modal" onClick={e => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <span className="mgr-modal-title">🏷 Новый промокод</span>
              <button className="mgr-modal-close" onClick={() => setPromoModal(false)}><X size={16} /></button>
            </div>
            <div className="mgr-modal-body">
              <div className="mgr-field">
                <label>Код</label>
                <input value={promoForm.code} onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} placeholder="SUMMER2026" />
              </div>
              <div className="mgr-fields-row">
                <div className="mgr-field">
                  <label>Скидка %</label>
                  <input type="number" value={promoForm.discount_percent} onChange={e => setPromoForm({ ...promoForm, discount_percent: e.target.value })} placeholder="20" />
                </div>
                <div className="mgr-field">
                  <label>Скидка ₽</label>
                  <input type="number" value={promoForm.discount_amount} onChange={e => setPromoForm({ ...promoForm, discount_amount: e.target.value })} placeholder="500" />
                </div>
              </div>
              <div className="mgr-fields-row">
                <div className="mgr-field">
                  <label>Лимит использований</label>
                  <input type="number" value={promoForm.max_uses} onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })} placeholder="100" />
                </div>
                <div className="mgr-field">
                  <label>Истекает</label>
                  <input type="datetime-local" value={promoForm.expires_at} onChange={e => setPromoForm({ ...promoForm, expires_at: e.target.value })} />
                </div>
              </div>
              <div className="mgr-field">
                <label>Тариф</label>
                <select value={promoForm.applicable_tiers} onChange={e => setPromoForm({ ...promoForm, applicable_tiers: e.target.value })}>
                  <option value="all">Все</option>
                  <option value="standard">Standard</option>
                  <option value="medium">Medium</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="mgr-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={promoForm.is_active} onChange={e => setPromoForm({ ...promoForm, is_active: e.target.checked })} id="promo-active" />
                <label htmlFor="promo-active" style={{ margin: 0 }}>Активен</label>
              </div>
            </div>
            <div className="mgr-modal-footer">
              <button className="btn-cancel" onClick={() => setPromoModal(false)}>Отмена</button>
              <button className="btn-save" onClick={savePromocode} disabled={!promoForm.code.trim()}>
                <Plus size={14} /> Создать
              </button>
            </div>
          </div>
        </div>
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
      {aiCourseModal && (
        <AiCourseModal
          onClose={() => setAiCourseModal(false)}
          onGenerate={handleAiCourseGenerate}
          loading={aiCourseLoading}
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
