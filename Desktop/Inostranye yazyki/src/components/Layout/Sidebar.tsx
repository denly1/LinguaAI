import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, BookOpen, CreditCard, BarChart2, Settings,
  Zap, Trophy, ChevronLeft, ChevronRight, Brain, Target, Award, Gamepad2, Shield, Crown, UserCheck, User as UserIcon, GraduationCap, LayoutDashboard, Mic, AlertTriangle, Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../../data/sampleData';
import './Sidebar.css';

const ROLE_LABELS: Record<string, { label: string; color: string; Icon: React.FC<any> }> = {
  admin:   { label: 'Администратор', color: '#f87171', Icon: Crown },
  manager: { label: 'Менеджер',       color: '#fbbf24', Icon: UserCheck },
  user:    { label: 'Пользователь',   color: '#60a5fa', Icon: UserIcon },
  guest:   { label: 'Гость',           color: '#9ca3af', Icon: UserIcon },
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { state } = useApp();
  const { isManager, isAdmin, authState } = useAuth();
  const { user } = state;

  const currentLangProgress = user?.learningLanguages.find(
    l => l.language === state.currentLanguage
  );

  const xpToNextLevel = 500;
  const xpProgress = currentLangProgress
    ? (currentLangProgress.xp % xpToNextLevel) / xpToNextLevel * 100
    : 0;

  const todayCards = currentLangProgress?.studySessions.find(
    s => s.date === new Date().toISOString().split('T')[0]
  )?.cardsStudied || 0;
  const dailyGoal = user?.dailyGoal ?? 20;

  const role = authState.currentUser?.role || 'user';
  const roleInfo = ROLE_LABELS[role];

  const isGuest = role === 'guest';

  const guestNavItems = [
    { to: '/dashboard',    icon: Home,           label: 'Главная',    end: true },
    { to: '/courses',      icon: GraduationCap,  label: 'Курсы',      end: false },
    { to: '/leaderboard',  icon: Award,          label: 'Лидеры',     end: false },
  ];

  const userNavItems = [
    { to: '/dashboard',    icon: Home,           label: 'Главная',    end: true },
    { to: '/courses',      icon: GraduationCap,  label: 'Курсы',      end: false },
    { to: '/flashcards',   icon: CreditCard,     label: 'Карточки',   end: false },
    { to: '/dictionaries', icon: BookOpen,       label: 'Словари',    end: false },
    { to: '/ai-tutor',     icon: Brain,          label: 'Тьютор',     end: false },
    { to: '/games',        icon: Gamepad2,       label: 'Игры',       end: false },
    { to: '/leaderboard',  icon: Award,          label: 'Лидеры',     end: false },
    { to: '/progress',        icon: BarChart2,       label: 'Прогресс',     end: false },
    { to: '/error-analysis',  icon: AlertTriangle,  label: 'Анализ ошибок', end: false },
    { to: '/voice-trainer',   icon: Mic,            label: 'Голосовой',    end: false },
    { to: '/notifications',   icon: Bell,           label: 'Уведомления',  end: false },
    { to: '/settings',        icon: Settings,       label: 'Настройки',    end: false },
  ];

  const navItems = isGuest ? guestNavItems : userNavItems;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Brain size={20} />
        </div>
        <span className="logo-text">ЛингваИИ</span>
      </div>

      <button className="sidebar-collapse-btn" onClick={onToggle} title={collapsed ? 'Развернуть' : 'Свернуть'}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {isGuest ? (
        !collapsed && (
          <div className="sidebar-guest-cta">
            <div className="sidebar-guest-text">Вы не вошли в аккаунт</div>
            <NavLink to="/auth" className="sidebar-guest-btn">Войти / Регистрация</NavLink>
          </div>
        )
      ) : user && (
        <div className="sidebar-user" title={collapsed ? user.name : undefined}>
          <div className="user-avatar" style={{ background: roleInfo?.color }}>
            {user.name.charAt(0)}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role-badge" style={{ color: roleInfo?.color }}>
              {roleInfo && <roleInfo.Icon size={10} />}
              {roleInfo?.label}
            </div>
            <div className="user-lang">
              {LANGUAGE_FLAGS[state.currentLanguage]} {LANGUAGE_NAMES[state.currentLanguage]}
            </div>
          </div>
        </div>
      )}

      {currentLangProgress && !collapsed && role !== 'guest' && (
        <div className="sidebar-xp">
          <div className="xp-header">
            <span className="xp-label"><Zap size={11} /> {currentLangProgress.xp} XP</span>
            <span className="xp-streak"><Trophy size={11} /> {user?.streak} дн.</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="nav-icon" />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        {(isManager || isAdmin) && (
          <>
            {!collapsed && <div className="nav-section-label">Управление</div>}
            {isManager && (
              <NavLink
                to="/manager"
                className={({ isActive }) => `nav-item nav-item-admin ${isActive ? 'active' : ''}`}
                title={collapsed ? 'Панель менеджера' : undefined}
              >
                <LayoutDashboard size={18} className="nav-icon" />
                <span className="nav-label">Менеджер</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-item nav-item-admin ${isActive ? 'active' : ''}`}
                title={collapsed ? 'Администрирование' : undefined}
              >
                <Shield size={18} className="nav-icon" />
                <span className="nav-label">Администрирование</span>
              </NavLink>
            )}
          </>
        )}
      </nav>

      {!collapsed && !isGuest && (
        <div className="sidebar-footer">
          <div className="daily-goal">
            <div className="goal-header">
              <Target size={12} />
              <span className="goal-label">Цель сегодня</span>
            </div>
            <div className="goal-progress-bar">
              <div
                className="goal-progress-fill"
                style={{ width: `${Math.min(100, (todayCards / dailyGoal) * 100)}%` }}
              />
            </div>
            <div className="goal-cards">{todayCards} / {dailyGoal} карточек</div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
