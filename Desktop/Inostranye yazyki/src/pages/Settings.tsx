import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, User, Bell, Trash2, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../data/sampleData';
import { LanguageCode, DifficultyLevel } from '../types';
import './Settings.css';

const LANGUAGES: LanguageCode[] = ['en', 'de', 'fr', 'es', 'it', 'zh', 'ja', 'pt'];

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const { user, currentLanguage } = state;
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const dailyGoal = user?.dailyGoal ?? 20;
  const notifications = user?.notificationsEnabled ?? true;
  const setDailyGoal = (g: number) => dispatch({ type: 'UPDATE_USER', payload: { dailyGoal: g } });
  const setNotifications = (v: boolean) => dispatch({ type: 'UPDATE_USER', payload: { notificationsEnabled: v } });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveName = () => {
    if (!name.trim() || !user) return;
    dispatch({ type: 'UPDATE_USER', payload: { name: name.trim() } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddLanguage = (lang: LanguageCode) => {
    if (!user) return;
    const alreadyLearning = user.learningLanguages.some(l => l.language === lang);
    if (alreadyLearning) return;
    const updatedLanguages = [...user.learningLanguages, {
      language: lang,
      level: 'beginner' as DifficultyLevel,
      xp: 0,
      wordsLearned: 0,
      accuracy: 0,
      studySessions: [],
    }];
    dispatch({ type: 'UPDATE_USER', payload: { learningLanguages: updatedLanguages } });
  };

  const handleRemoveLanguage = (lang: LanguageCode) => {
    if (!user || user.learningLanguages.length <= 1) return;
    const updatedLanguages = user.learningLanguages.filter(l => l.language !== lang);
    dispatch({ type: 'UPDATE_USER', payload: { learningLanguages: updatedLanguages } });
  };

  const handleSetCurrentLanguage = (lang: LanguageCode) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  const handleResetProgress = () => {
    if (!user) return;
    const resetLanguages = user.learningLanguages.map(l => ({
      ...l, xp: 0, wordsLearned: 0, accuracy: 0, studySessions: [],
    }));
    dispatch({ type: 'UPDATE_USER', payload: { learningLanguages: resetLanguages, totalXP: 0, streak: 0 } });
    setShowResetConfirm(false);
  };

  const availableLangs = LANGUAGES.filter(
    l => !user?.learningLanguages.some(ul => ul.language === l)
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1><SettingsIcon size={24} /> Настройки</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-section">
          <div className="section-header">
            <User size={16} />
            <h2>Профиль</h2>
          </div>
          <div className="settings-card">
            <div className="profile-display">
              <div className="profile-avatar-big">
                {user?.name.charAt(0) || 'А'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name}</div>
                <div className="profile-stats">
                  {user?.totalXP} XP · Серия {user?.streak} дней · Присоединился {new Date(user?.joinedAt || '').toLocaleDateString('ru')}
                </div>
              </div>
            </div>
            <div className="form-group mt-16">
              <label>Имя пользователя</label>
              <div className="input-with-btn">
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  className={`btn-save ${saved ? 'saved' : ''}`}
                  onClick={handleSaveName}
                >
                  {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Globe size={16} />
            <h2>Языки обучения</h2>
          </div>
          <div className="settings-card">
            <div className="current-lang-header">
              <span className="sect-label">Активные языки</span>
              <span className="sect-hint">Нажмите, чтобы переключиться</span>
            </div>
            <div className="active-langs">
              {user?.learningLanguages.map(l => (
                <div
                  key={l.language}
                  className={`lang-setting-item ${l.language === currentLanguage ? 'active' : ''}`}
                  onClick={() => handleSetCurrentLanguage(l.language)}
                >
                  <div className="lang-flag-big">{LANGUAGE_FLAGS[l.language]}</div>
                  <div className="lang-setting-info">
                    <div className="lang-setting-name">{LANGUAGE_NAMES[l.language]}</div>
                    <div className="lang-setting-stats">{l.xp} XP · {l.wordsLearned} слов</div>
                  </div>
                  {l.language === currentLanguage && (
                    <div className="active-badge"><Check size={12} /> Активный</div>
                  )}
                  {user.learningLanguages.length > 1 && l.language !== currentLanguage && (
                    <button
                      className="btn-remove-lang"
                      onClick={e => { e.stopPropagation(); handleRemoveLanguage(l.language); }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {availableLangs.length > 0 && (
              <>
                <div className="add-lang-header">
                  <span className="sect-label">Добавить язык</span>
                </div>
                <div className="add-langs-grid">
                  {availableLangs.map(l => (
                    <button key={l} className="add-lang-btn" onClick={() => handleAddLanguage(l)}>
                      <span>{LANGUAGE_FLAGS[l]}</span>
                      <span>{LANGUAGE_NAMES[l]}</span>
                      <Plus size={12} className="add-icon" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Bell size={16} />
            <h2>Обучение</h2>
          </div>
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-name">Ежедневная цель</div>
                <div className="setting-desc">Количество карточек в день</div>
              </div>
              <div className="goal-selector">
                {[10, 15, 20, 30, 50].map(g => (
                  <button
                    key={g}
                    className={`goal-btn ${dailyGoal === g ? 'active' : ''}`}
                    onClick={() => setDailyGoal(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-name">Уведомления</div>
                <div className="setting-desc">Напоминания о занятиях</div>
              </div>
              <div
                className={`toggle ${notifications ? 'on' : 'off'}`}
                onClick={() => setNotifications(!notifications)}
              >
                <div className="toggle-thumb" />
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-name">Умные рекомендации</div>
                <div className="setting-desc">Адаптивный подбор контента</div>
              </div>
              <div className="toggle on">
                <div className="toggle-thumb" />
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-name">Интервальное повторение</div>
                <div className="setting-desc">Алгоритм SM-2 для карточек</div>
              </div>
              <div className="toggle on">
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header danger">
            <Trash2 size={16} />
            <h2>Опасная зона</h2>
          </div>
          <div className="settings-card danger-card">
            <div className="danger-row">
              <div>
                <div className="danger-title">Сбросить прогресс</div>
                <div className="danger-desc">Все данные о занятиях и XP будут удалены. Слова и словари сохранятся.</div>
              </div>
              {!showResetConfirm ? (
                <button className="btn-danger" onClick={() => setShowResetConfirm(true)}>
                  Сбросить
                </button>
              ) : (
                <div className="confirm-btns">
                  <span className="confirm-text">Вы уверены?</span>
                  <button className="btn-danger" onClick={handleResetProgress}>Да, сбросить</button>
                  <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>Отмена</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <SettingsIcon size={16} />
            <h2>О приложении</h2>
          </div>
          <div className="settings-card about-card">
            <div className="about-logo">
              <div className="about-icon">🧠</div>
              <div>
                <div className="about-name">LinguaAI</div>
                <div className="about-ver">Версия 1.0.0</div>
              </div>
            </div>
            <p className="about-desc">
              LinguaAI — веб-приложение для изучения иностранных языков с помощью карточек, словарей и адаптивного повторения материала.
            </p>
            <div className="about-features">
              <div className="feat-item"><Check size={12} color="#10b981" /> Алгоритм SM-2 интервального повторения</div>
              <div className="feat-item"><Check size={12} color="#10b981" /> Раздел чата с персональными советами по языку</div>
              <div className="feat-item"><Check size={12} color="#10b981" /> Адаптивный подбор уровня сложности</div>
              <div className="feat-item"><Check size={12} color="#10b981" /> 8 языков: EN, DE, FR, ES, IT, ZH, JA, PT</div>
              <div className="feat-item"><Check size={12} color="#10b981" /> Отслеживание прогресса и статистика</div>
              <div className="feat-item"><Check size={12} color="#10b981" /> Система достижений и серий</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
