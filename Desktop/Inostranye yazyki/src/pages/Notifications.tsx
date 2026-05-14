import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Trash2, Settings2, Award, Flame, Info, RefreshCw } from 'lucide-react';
import {
  AppNotification, getStoredNotifications, markAllRead, clearNotifications,
  requestPushPermission, scheduleDailyReminder, addNotification,
} from '../services/notifications';
import './Notifications.css';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  reminder: <Bell size={16} />,
  achievement: <Award size={16} />,
  streak: <Flame size={16} />,
  system: <Info size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  reminder: 'rgba(99,102,241,0.15)',
  achievement: 'rgba(245,158,11,0.15)',
  streak: 'rgba(239,68,68,0.15)',
  system: 'rgba(16,185,129,0.15)',
};

const TYPE_TEXT_COLORS: Record<string, string> = {
  reminder: '#818cf8',
  achievement: '#fbbf24',
  streak: '#f87171',
  system: '#34d399',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

const Notifications: React.FC = () => {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminderHour, setReminderHour] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    setNotifs(getStoredNotifications());
    setPermission(Notification.permission as NotificationPermission);
  }, []);

  const refresh = () => setNotifs(getStoredNotifications());

  const handleRequestPermission = async () => {
    const p = await requestPushPermission();
    setPermission(p);
    if (p === 'granted') {
      addNotification({
        type: 'system',
        title: '✅ Push-уведомления включены',
        body: 'Теперь вы будете получать напоминания о занятиях.',
      });
      refresh();
    }
  };

  const handleSetReminder = () => {
    scheduleDailyReminder(reminderHour, 0);
    setReminderSet(true);
    addNotification({
      type: 'reminder',
      title: `⏰ Напоминание установлено на ${reminderHour}:00`,
      body: 'Каждый день в это время вы получите напоминание о занятии.',
    });
    refresh();
  };

  const handleMarkAllRead = () => {
    markAllRead();
    refresh();
  };

  const handleClear = () => {
    clearNotifications();
    setNotifs([]);
  };

  const handleTestPush = () => {
    addNotification({
      type: 'system',
      title: '🧪 Тестовое уведомление',
      body: 'Уведомления работают корректно!',
    });
    if (permission === 'granted') {
      new Notification('🧪 LinguaAI', { body: 'Тестовое уведомление работает!' });
    }
    refresh();
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-header-icon"><Bell size={22} /></div>
          <div>
            <h1>Уведомления {unread > 0 && <span className="notif-badge">{unread}</span>}</h1>
            <p>Push-уведомления и напоминания о занятиях</p>
          </div>
        </div>
        <div className="notif-header-actions">
          <button className="notif-action-btn" onClick={() => setShowSettings(s => !s)}>
            <Settings2 size={14} /> Настройки
          </button>
          {unread > 0 && (
            <button className="notif-action-btn" onClick={handleMarkAllRead}>
              <Check size={14} /> Прочитать все
            </button>
          )}
          {notifs.length > 0 && (
            <button className="notif-action-btn notif-action-danger" onClick={handleClear}>
              <Trash2 size={14} /> Очистить
            </button>
          )}
        </div>
      </div>

      {/* Push permission banner */}
      {permission !== 'granted' && (
        <div className="notif-permission-banner">
          <div className="notif-permission-info">
            <Bell size={18} />
            <div>
              <div className="notif-permission-title">Включите push-уведомления</div>
              <div className="notif-permission-sub">Получайте напоминания о занятиях и уведомления о достижениях</div>
            </div>
          </div>
          {permission === 'denied' ? (
            <div className="notif-permission-denied">
              <BellOff size={14} /> Заблокированы в браузере
            </div>
          ) : (
            <button className="notif-permission-btn" onClick={handleRequestPermission}>
              Разрешить уведомления
            </button>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="notif-settings">
          <div className="notif-settings-title">⚙️ Настройки уведомлений</div>
          <div className="notif-settings-row">
            <label>Ежедневное напоминание в:</label>
            <select
              value={reminderHour}
              onChange={e => setReminderHour(Number(e.target.value))}
              className="notif-select"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
            <button className="notif-set-btn" onClick={handleSetReminder}>
              {reminderSet ? <><Check size={13} /> Установлено</> : 'Установить'}
            </button>
          </div>
          <div className="notif-settings-row">
            <label>Тест уведомлений:</label>
            <button className="notif-test-btn" onClick={handleTestPush}>
              <RefreshCw size={13} /> Отправить тестовое
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="notif-list">
        {notifs.length === 0 ? (
          <div className="notif-empty-state">
            <Bell size={48} style={{ opacity: 0.3 }} />
            <h3>Нет уведомлений</h3>
            <p>Здесь будут отображаться напоминания о занятиях, достижения и системные сообщения.</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
            <div
              className="notif-item-icon"
              style={{ background: TYPE_COLORS[n.type], color: TYPE_TEXT_COLORS[n.type] }}
            >
              {TYPE_ICONS[n.type]}
            </div>
            <div className="notif-item-body">
              <div className="notif-item-title">{n.title}</div>
              <div className="notif-item-text">{n.body}</div>
              <div className="notif-item-time">{timeAgo(n.timestamp)}</div>
            </div>
            {!n.read && <div className="notif-unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
