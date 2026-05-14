import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthAction, AuthUser } from '../types/auth';
import { apiLogin, apiRegister, apiGetUsers, apiUpdateUserRole, apiToggleUserActive, ApiUser } from '../services/api';

const GUEST_USER: AuthUser = {
  id: 'guest',
  email: '',
  name: 'Гость',
  role: 'guest',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  isActive: true,
  totalXP: 0,
  streak: 0,
};

function apiUserToAuthUser(u: ApiUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.created_at,
    lastLogin: u.last_login,
    isActive: u.is_active,
    totalXP: u.total_xp,
    streak: u.streak,
  };
}

const initialState: AuthState = {
  currentUser: GUEST_USER,
  isAuthenticated: true,
  users: [],
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOAD_AUTH':
      return action.payload;
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
        users: state.users.map(u =>
          u.id === action.payload.id
            ? { ...u, lastLogin: new Date().toISOString() }
            : u
        ),
      };
    case 'LOGIN_GUEST':
      return { ...state, currentUser: GUEST_USER, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, currentUser: GUEST_USER, isAuthenticated: true };
    case 'REGISTER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_PROFILE':
      if (!state.currentUser) return state;
      const updated = { ...state.currentUser, ...action.payload };
      return {
        ...state,
        currentUser: updated,
        users: state.users.map(u => u.id === updated.id ? updated : u),
      };
    case 'ADMIN_UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u),
        currentUser: state.currentUser?.id === action.payload.id ? action.payload : state.currentUser,
      };
    case 'ADMIN_DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload),
      };
    case 'ADMIN_TOGGLE_USER':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.payload ? { ...u, isActive: !u.isActive } : u
        ),
      };
    default:
      return state;
  }
}

interface AuthContextType {
  authState: AuthState;
  authDispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsGuest: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(reducer, initialState);

  // Восстанавливаем сессию из localStorage при загрузке
  useEffect(() => {
    const saved = localStorage.getItem('linguaai-current-user');
    if (saved) {
      try {
        const user = JSON.parse(saved) as AuthUser;
        if (user && user.role !== 'guest') {
          authDispatch({ type: 'LOGIN', payload: user });
        }
      } catch (_) {}
    }
  }, []);

  // Сохраняем текущего пользователя в localStorage
  useEffect(() => {
    if (authState.currentUser && authState.currentUser.role !== 'guest') {
      localStorage.setItem('linguaai-current-user', JSON.stringify(authState.currentUser));
    } else {
      localStorage.removeItem('linguaai-current-user');
    }
  }, [authState.currentUser]);

  // Загружаем список пользователей для админки
  useEffect(() => {
    if (authState.currentUser?.role === 'admin' || authState.currentUser?.role === 'manager') {
      apiGetUsers().then(res => {
        const users = res.users.map(apiUserToAuthUser);
        authDispatch({ type: 'LOAD_AUTH', payload: { ...authState, users } });
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.currentUser?.role]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiLogin(email, password);
      const user = apiUserToAuthUser(res.user);
      authDispatch({ type: 'LOGIN', payload: user });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка входа' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!name.trim()) return { success: false, error: 'Введите имя' };
    if (!email.includes('@')) return { success: false, error: 'Неверный email' };
    if (password.length < 6) return { success: false, error: 'Пароль минимум 6 символов' };
    try {
      const res = await apiRegister(name, email, password);
      const user = apiUserToAuthUser(res.user);
      authDispatch({ type: 'REGISTER', payload: user });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка регистрации' };
    }
  };

  const logout = () => {
    authDispatch({ type: 'LOGOUT' });
  };

  const loginAsGuest = () => {
    authDispatch({ type: 'LOGIN_GUEST' });
  };

  // Обёртки для adminPanel — синхронизируем с бэком
  const wrappedDispatch: React.Dispatch<AuthAction> = (action) => {
    authDispatch(action);
    if (action.type === 'ADMIN_UPDATE_USER') {
      apiUpdateUserRole(action.payload.id, action.payload.role).catch(() => {});
      apiToggleUserActive(action.payload.id, action.payload.isActive).catch(() => {});
    }
    if (action.type === 'ADMIN_TOGGLE_USER') {
      const target = authState.users.find(u => u.id === action.payload);
      if (target) apiToggleUserActive(action.payload, !target.isActive).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{
      authState,
      authDispatch: wrappedDispatch,
      login,
      register,
      logout,
      loginAsGuest,
      isAdmin: authState.currentUser?.role === 'admin',
      isManager: authState.currentUser?.role === 'admin' || authState.currentUser?.role === 'manager',
      isGuest: authState.currentUser?.role === 'guest',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
