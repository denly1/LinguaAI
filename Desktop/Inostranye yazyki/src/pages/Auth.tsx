import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Eye, EyeOff, Zap, Globe, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem('linguaai-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) { navigate('/dashboard'); return; }
      setError(res.error || 'Ошибка входа');
    } else {
      const res = await register(name, email, password);
      if (res.success) { navigate('/dashboard'); return; }
      setError(res.error || 'Ошибка регистрации');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <button
        onClick={() => navigate('/')}
        style={{ position: 'fixed', top: 20, left: 24, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
      >
        <ArrowLeft size={14} /> На главную
      </button>
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-logo">
            <div className="auth-logo-icon"><Brain size={28} /></div>
            <span className="auth-brand">LinguaAI</span>
          </div>
          <h2 className="auth-left-title">Изучайте языки с умом</h2>
          <p className="auth-left-sub">Умные карточки, словари и персональный помощник для эффективного изучения языков</p>
          <div className="auth-left-features">
            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}><Brain size={18} /></div>
              <div>
                <div className="auth-feature-title">Умный помощник по языку</div>
                <div className="auth-feature-desc">Персональный ассистент адаптирует обучение под ваш уровень</div>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}><Zap size={18} /></div>
              <div>
                <div className="auth-feature-title">Интервальное повторение</div>
                <div className="auth-feature-desc">Встроенный алгоритм повторения для долгосрочного запоминания слов</div>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}><Globe size={18} /></div>
              <div>
                <div className="auth-feature-title">3 языка</div>
                <div className="auth-feature-desc">Английский, французский, китайский</div>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-card-title">
            {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
          </div>
          <div className="auth-card-sub">
            {mode === 'login' ? 'Войдите в свой аккаунт LinguaAI' : 'Зарегистрируйтесь бесплатно'}
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Войти
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Регистрация
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="auth-field">
                <label>Ваше имя</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="Имя"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={mode === 'login'}
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Пароль</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            >
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
