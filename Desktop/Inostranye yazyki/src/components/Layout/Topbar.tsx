import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, LogOut, User, ChevronDown, Shield, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

interface TopbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ theme, onToggleTheme }) => {
  const { authState, logout, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { currentUser } = authState;
  const [showUser, setShowUser] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifications] = useState<{id:number;text:string;time:string;read:boolean}[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const ROUTES: Record<string, string> = {
    'главная': '/dashboard', 'дашборд': '/dashboard',
    'карточки': '/flashcards', 'flashcards': '/flashcards',
    'словари': '/dictionaries', 'словарь': '/dictionaries',
    'тьютор': '/ai-tutor', 'ии': '/ai-tutor', 'ai': '/ai-tutor',
    'прогресс': '/progress', 'статистика': '/progress',
    'настройки': '/settings',
    'admin': '/admin', 'администратор': '/admin', 'панель': '/admin',
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      const lower = searchVal.toLowerCase().trim();
      const route = Object.entries(ROUTES).find(([k]) => lower.includes(k))?.[1];
      if (route) navigate(route);
      setShowSearch(false);
      setSearchVal('');
    }
    if (e.key === 'Escape') { setShowSearch(false); setSearchVal(''); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', manager: 'Менеджер', user: 'Пользователь' };
  const ROLE_COLORS: Record<string, string> = { admin: '#f87171', manager: '#fbbf24', user: '#60a5fa' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showSearch ? (
          <div className="topbar-search-full">
            <Search size={15} />
            <input
              ref={searchRef}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Поиск по разделам... (Enter для перехода)"
            />
            <button onClick={() => { setShowSearch(false); setSearchVal(''); }}><X size={14} /></button>
          </div>
        ) : (
          <button className="topbar-search-btn" onClick={() => setShowSearch(true)}>
            <Search size={15} />
            <span>Поиск по разделам...</span>
            <kbd>⌘K</kbd>
          </button>
        )}
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={onToggleTheme} title="Сменить тему">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="notif-wrap" ref={notifRef}>
          <button className="topbar-icon-btn notif-btn" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={17} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">Уведомления</div>
              {notifications.length === 0
                ? <div className="notif-empty">Нет новых уведомлений</div>
                : notifications.map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {currentUser?.role === 'guest' ? (
          <button
            className="topbar-user-btn"
            style={{ background: 'var(--primary)', color: '#fff', borderRadius: 8, padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/auth')}
          >
            <LogOut size={15} /> Войти
          </button>
        ) : (
          <div className="user-menu-wrap" ref={dropRef}>
            <button className="topbar-user-btn" onClick={() => setShowUser(!showUser)}>
              <div className="topbar-avatar">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{currentUser?.name}</span>
                <span className="topbar-user-role" style={{ color: ROLE_COLORS[currentUser?.role || 'user'] }}>
                  {ROLE_LABELS[currentUser?.role || 'user']}
                </span>
              </div>
              <ChevronDown size={14} className={`chevron ${showUser ? 'open' : ''}`} />
            </button>

            {showUser && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="ud-avatar">{currentUser?.name.charAt(0)}</div>
                  <div>
                    <div className="ud-name">{currentUser?.name}</div>
                    <div className="ud-email">{currentUser?.email}</div>
                  </div>
                </div>
                <div className="ud-divider" />
                <button className="ud-item" onClick={() => { navigate('/settings'); setShowUser(false); }}>
                  <User size={14} /> Профиль
                </button>
                {isAdmin && (
                  <button className="ud-item admin" onClick={() => { navigate('/admin'); setShowUser(false); }}>
                    <Shield size={14} /> Администрирование
                  </button>
                )}
                {isManager && !isAdmin && (
                  <button className="ud-item admin" onClick={() => { navigate('/manager'); setShowUser(false); }}>
                    <Shield size={14} /> Панель менеджера
                  </button>
                )}
                <div className="ud-divider" />
                <button className="ud-item logout" onClick={() => { logout(); setShowUser(false); }}>
                  <LogOut size={14} /> Выйти из аккаунта
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
