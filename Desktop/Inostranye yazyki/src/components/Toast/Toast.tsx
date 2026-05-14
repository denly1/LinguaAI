import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'info' | 'xp' | 'achievement';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  icon?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, icon?: string, duration?: number) => void;
  showXP: (amount: number) => void;
  showAchievement: (title: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', icon?: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, message, icon, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const showXP = useCallback((amount: number) => {
    showToast(`+${amount} XP`, 'xp', '⚡', 2500);
  }, [showToast]);

  const showAchievement = useCallback((title: string) => {
    showToast(`Достижение: ${title}`, 'achievement', '🏆', 4000);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showXP, showAchievement }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
            {t.icon && <span className="toast-icon">{t.icon}</span>}
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
