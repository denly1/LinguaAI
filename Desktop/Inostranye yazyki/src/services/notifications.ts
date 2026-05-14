export type NotifType = 'reminder' | 'achievement' | 'streak' | 'system';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  icon?: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'linguaai-notifications';

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifs: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50)));
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const all = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  saveNotifications([newNotif, ...all]);
  return newNotif;
}

export function markAllRead() {
  const all = getStoredNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(all);
}

export function clearNotifications() {
  saveNotifications([]);
}

// Запрос разрешения на браузерные push
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

// Отправка браузерного push
export function sendBrowserPush(title: string, body: string, icon = '/favicon.ico') {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon });
  setTimeout(() => n.close(), 6000);
}

// Планировщик ежедневного напоминания
export function scheduleDailyReminder(hour = 20, minute = 0) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();

  const id = setTimeout(() => {
    addNotification({
      type: 'reminder',
      title: '📚 Время учиться!',
      body: 'Не забудьте позаниматься сегодня. Ваш стрик ждёт!',
    });
    sendBrowserPush('📚 Время учиться!', 'Не забудьте позаниматься сегодня. Ваш стрик ждёт!');
  }, delay);

  return id;
}

// Уведомление о достижении
export function notifyAchievement(name: string, desc: string) {
  addNotification({ type: 'achievement', title: `🏆 Достижение: ${name}`, body: desc });
  sendBrowserPush(`🏆 ${name}`, desc);
}

// Уведомление о стрике
export function notifyStreak(days: number) {
  addNotification({
    type: 'streak',
    title: `🔥 ${days} дней подряд!`,
    body: `Вы занимаетесь уже ${days} дней без пропусков. Так держать!`,
  });
  sendBrowserPush(`🔥 Стрик: ${days} дней!`, `Вы занимаетесь уже ${days} дней без пропусков.`);
}
