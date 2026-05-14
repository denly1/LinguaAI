import React, { useState, useRef, useMemo } from 'react';
import { Plus, Search, BookOpen, Trash2, ChevronRight, X, Tag, Download, Upload, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast/Toast';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../data/sampleData';
import { Dictionary, LanguageCode, DifficultyLevel } from '../types';
import { exportDictionaryCSV, exportDictionaryJSON, exportAllJSON, parseCSVImport, speakWord } from '../services/exportService';
import './Dictionaries.css';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4'];

const levelLabels: Record<DifficultyLevel, string> = {
  beginner: 'A1 Начинающий',
  elementary: 'A2 Элементарный',
  intermediate: 'B1 Средний',
  'upper-intermediate': 'B2 Выше среднего',
  advanced: 'C1 Продвинутый',
};

const Dictionaries: React.FC = () => {
  const { state, dispatch, addDictionary, addWordToDictionary } = useApp();
  const { showToast } = useToast();
  const { dictionaries, currentLanguage } = state;
  const importRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [showCreateDict, setShowCreateDict] = useState(false);
  const [selectedDictId, setSelectedDictId] = useState<string | null>(null);
  const selectedDict = useMemo(
    () => dictionaries.find(d => d.id === selectedDictId) ?? null,
    [dictionaries, selectedDictId]
  );
  const [showAddWord, setShowAddWord] = useState(false);
  const [langFilter, setLangFilter] = useState<'all' | LanguageCode>('all');

  const [newDict, setNewDict] = useState({ name: '', description: '', language: currentLanguage as LanguageCode, level: 'intermediate' as DifficultyLevel, tags: '', color: COLORS[0] });
  const [newWord, setNewWord] = useState({ term: '', translation: '', phonetic: '', partOfSpeech: '', examples: '', tags: '' });

  const filtered = dictionaries.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchLang = langFilter === 'all' || d.language === langFilter;
    return matchSearch && matchLang;
  });

  const handleCreateDict = () => {
    if (!newDict.name.trim()) return;
    addDictionary(newDict.name, newDict.description, newDict.language, newDict.level, newDict.tags.split(',').map(t => t.trim()).filter(Boolean), newDict.color);
    setNewDict({ name: '', description: '', language: currentLanguage, level: 'intermediate', tags: '', color: COLORS[0] });
    setShowCreateDict(false);
  };

  const handleAddWord = () => {
    if (!newWord.term.trim() || !newWord.translation.trim() || !selectedDict) return;
    addWordToDictionary(selectedDict.id, {
      term: newWord.term,
      translation: newWord.translation,
      language: selectedDict.language,
      nativeLanguage: selectedDict.language,
      phonetic: newWord.phonetic || undefined,
      partOfSpeech: newWord.partOfSpeech || undefined,
      examples: newWord.examples ? newWord.examples.split('\n').filter(Boolean) : [],
      tags: newWord.tags.split(',').map(t => t.trim()).filter(Boolean),
      difficulty: selectedDict.level,
    });
    setNewWord({ term: '', translation: '', phonetic: '', partOfSpeech: '', examples: '', tags: '' });
    setShowAddWord(false);
  };

  const handleDeleteDict = (dictId: string) => {
    if (window.confirm('Удалить словарь?')) {
      dispatch({ type: 'DELETE_DICTIONARY', payload: dictId });
      if (selectedDictId === dictId) setSelectedDictId(null);
    }
  };

  const handleExportCSV = () => {
    if (!selectedDict) return;
    exportDictionaryCSV(selectedDict);
    showToast('Словарь экспортирован в CSV', 'success');
  };

  const handleExportJSON = () => {
    if (!selectedDict) return;
    exportDictionaryJSON(selectedDict);
    showToast('Словарь экспортирован в JSON', 'success');
  };

  const handleExportAll = () => {
    exportAllJSON(dictionaries);
    showToast('Все словари экспортированы', 'success');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDict) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const words = parseCSVImport(text, selectedDict.language, selectedDict.nativeLanguage);
      words.forEach(w => addWordToDictionary(selectedDict.id, w));
      showToast(`Импортировано ${words.length} слов`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteWord = (wordId: string) => {
    if (!selectedDict) return;
    dispatch({ type: 'DELETE_WORD', payload: { dictionaryId: selectedDict.id, wordId } });
  };

  const langs = Array.from(new Set(dictionaries.map(d => d.language))) as LanguageCode[];

  return (
    <div className="dictionaries-page">
      <div className="dict-layout">
        <div className="dict-list-panel">
          <div className="dict-panel-header">
            <h1>Словари</h1>
            <button className="btn-primary" onClick={() => setShowCreateDict(true)}>
              <Plus size={16} /> Создать
            </button>
          </div>

          <div className="dict-search">
            <Search size={16} className="search-icon" />
            <input
              placeholder="Поиск словарей..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="lang-filter-tabs">
            <button className={`lang-tab ${langFilter === 'all' ? 'active' : ''}`} onClick={() => setLangFilter('all')}>
              Все ({dictionaries.length})
            </button>
            {langs.map(l => (
              <button key={l} className={`lang-tab ${langFilter === l ? 'active' : ''}`} onClick={() => setLangFilter(l)}>
                {LANGUAGE_FLAGS[l as LanguageCode]} {LANGUAGE_NAMES[l as LanguageCode]} ({dictionaries.filter(d => d.language === l).length})
              </button>
            ))}
          </div>

          <div className="dict-cards">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <p>Словарей не найдено</p>
              </div>
            ) : filtered.map(dict => (
              <div
                key={dict.id}
                className={`dict-card ${selectedDict?.id === dict.id ? 'selected' : ''}`}
                onClick={() => setSelectedDictId(dict.id)}
              >
                <div className="dict-card-color" style={{ background: dict.coverColor || '#5555cc' }} />
                <div className="dict-card-body">
                  <div className="dict-card-top">
                    <span className="dict-lang">{LANGUAGE_FLAGS[dict.language] || '🌐'} {LANGUAGE_NAMES[dict.language] || dict.language}</span>
                    <span className="dict-level">{levelLabels[dict.level] || dict.level}</span>
                  </div>
                  <div className="dict-card-name">{dict.name || 'Без названия'}</div>
                  <div className="dict-card-desc">{dict.description || ''}</div>
                  <div className="dict-card-footer">
                    <span className="dict-word-count">{(dict.words || []).length} слов</span>
                    <div className="dict-tags">
                      {(dict.tags || []).slice(0, 2).map(t => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="dict-arrow" />
              </div>
            ))}
          </div>
        </div>

        <div className="dict-detail-panel">
          {selectedDict ? (
            <>
              <div className="detail-header">
                <div className="detail-header-color" style={{ background: selectedDict.coverColor }} />
                <div className="detail-header-info">
                  <div className="detail-lang">{LANGUAGE_FLAGS[selectedDict.language]} {LANGUAGE_NAMES[selectedDict.language]} · {levelLabels[selectedDict.level]}</div>
                  <h2>{selectedDict.name}</h2>
                  <p>{selectedDict.description}</p>
                  <div className="detail-tags">
                    {(selectedDict.tags || []).map(t => <span key={t} className="tag"><Tag size={10} /> {t}</span>)}
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="btn-secondary btn-sm" onClick={() => setShowAddWord(true)}>
                    <Plus size={14} /> Слово
                  </button>
                  <button className="btn-secondary btn-sm" onClick={handleExportCSV} title="Скачать CSV">
                    <Download size={14} /> CSV
                  </button>
                  <button className="btn-secondary btn-sm" onClick={handleExportJSON} title="Скачать JSON">
                    <Download size={14} /> JSON
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => importRef.current?.click()} title="Импорт CSV">
                    <Upload size={14} /> Импорт
                  </button>
                  <button className="btn-danger-sm" onClick={() => handleDeleteDict(selectedDict.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <input ref={importRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleImportCSV} />
              </div>

              <div className="detail-stats">
                <div className="det-stat">
                  <div className="det-stat-val">{selectedDict.words.length}</div>
                  <div className="det-stat-lbl">Всего слов</div>
                </div>
                <div className="det-stat">
                  <div className="det-stat-val">{selectedDict.words.filter(w => w.difficulty === 'beginner' || w.difficulty === 'elementary').length}</div>
                  <div className="det-stat-lbl">Лёгкие</div>
                </div>
                <div className="det-stat">
                  <div className="det-stat-val">{selectedDict.words.filter(w => w.difficulty === 'advanced' || w.difficulty === 'upper-intermediate').length}</div>
                  <div className="det-stat-lbl">Сложные</div>
                </div>
              </div>

              <div className="words-list">
                {selectedDict.words.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✏️</div>
                    <p>Добавьте первое слово в словарь</p>
                    <button className="btn-primary" onClick={() => setShowAddWord(true)}>
                      <Plus size={14} /> Добавить слово
                    </button>
                  </div>
                ) : selectedDict.words.map(word => (
                  <div key={word.id} className="word-item">
                    <div className="word-main">
                    <div className="word-term-row">
                      <div className="word-term">{word.term}</div>
                      <button className="word-tts-btn" onClick={() => speakWord(word.term, selectedDict.language)} title="Озвучить">
                        <Volume2 size={13} />
                      </button>
                    </div>
                    {word.phonetic && <div className="word-phonetic">{word.phonetic}</div>}
                    {word.partOfSpeech && <span className="word-pos">{word.partOfSpeech}</span>}
                  </div>
                    <div className="word-translation">{word.translation}</div>
                    {word.examples.length > 0 && (
                      <div className="word-example">"{word.examples[0]}"</div>
                    )}
                    <div className="word-footer">
                      <div className="word-tags">
                        {word.tags.slice(0, 3).map(t => <span key={t} className="tag small">{t}</span>)}
                      </div>
                      <button className="btn-delete-word" onClick={() => handleDeleteWord(word.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <BookOpen size={48} />
              <h3>Выберите словарь</h3>
              <p>Нажмите на словарь слева, чтобы просмотреть его содержимое</p>
            </div>
          )}
          <div className="dict-export-all">
            <button className="btn-secondary btn-sm" onClick={handleExportAll}>
              <Download size={13} /> Экспорт всех словарей
            </button>
          </div>
        </div>
      </div>

      {showCreateDict && (
        <div className="modal-overlay" onClick={() => setShowCreateDict(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Создать словарь</h3>
              <button className="btn-icon" onClick={() => setShowCreateDict(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название *</label>
                <input value={newDict.name} onChange={e => setNewDict(p => ({ ...p, name: e.target.value }))} placeholder="Название словаря" className="form-input" />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input value={newDict.description} onChange={e => setNewDict(p => ({ ...p, description: e.target.value }))} placeholder="Описание" className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Язык</label>
                  <select value={newDict.language} onChange={e => setNewDict(p => ({ ...p, language: e.target.value as LanguageCode }))} className="form-input">
                    {(Object.keys(LANGUAGE_NAMES) as LanguageCode[]).map(l => (
                      <option key={l} value={l}>{LANGUAGE_FLAGS[l]} {LANGUAGE_NAMES[l]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Уровень</label>
                  <select value={newDict.level} onChange={e => setNewDict(p => ({ ...p, level: e.target.value as DifficultyLevel }))} className="form-input">
                    {(Object.entries(levelLabels) as [DifficultyLevel, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Теги (через запятую)</label>
                <input value={newDict.tags} onChange={e => setNewDict(p => ({ ...p, tags: e.target.value }))} placeholder="бизнес, грамматика, ..." className="form-input" />
              </div>
              <div className="form-group">
                <label>Цвет обложки</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <div key={c} className={`color-dot ${newDict.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setNewDict(p => ({ ...p, color: c }))} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateDict(false)}>Отмена</button>
              <button className="btn-primary" onClick={handleCreateDict} disabled={!newDict.name.trim()}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {showAddWord && selectedDict && (
        <div className="modal-overlay" onClick={() => setShowAddWord(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Добавить слово</h3>
              <button className="btn-icon" onClick={() => setShowAddWord(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Слово *</label>
                  <input value={newWord.term} onChange={e => setNewWord(p => ({ ...p, term: e.target.value }))} placeholder="Слово на изучаемом языке" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Перевод *</label>
                  <input value={newWord.translation} onChange={e => setNewWord(p => ({ ...p, translation: e.target.value }))} placeholder="Перевод" className="form-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Транскрипция</label>
                  <input value={newWord.phonetic} onChange={e => setNewWord(p => ({ ...p, phonetic: e.target.value }))} placeholder="/fəˈnɛtɪk/" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Часть речи</label>
                  <select value={newWord.partOfSpeech} onChange={e => setNewWord(p => ({ ...p, partOfSpeech: e.target.value }))} className="form-input">
                    <option value="">—</option>
                    <option>noun</option><option>verb</option><option>adjective</option>
                    <option>adverb</option><option>preposition</option><option>conjunction</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Примеры (каждый с новой строки)</label>
                <textarea value={newWord.examples} onChange={e => setNewWord(p => ({ ...p, examples: e.target.value }))} placeholder="Пример предложения..." className="form-input" rows={3} />
              </div>
              <div className="form-group">
                <label>Теги (через запятую)</label>
                <input value={newWord.tags} onChange={e => setNewWord(p => ({ ...p, tags: e.target.value }))} placeholder="бизнес, глаголы, ..." className="form-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddWord(false)}>Отмена</button>
              <button className="btn-primary" onClick={handleAddWord} disabled={!newWord.term.trim() || !newWord.translation.trim()}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionaries;
