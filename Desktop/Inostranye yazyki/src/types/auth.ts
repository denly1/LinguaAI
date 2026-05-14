export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  totalXP: number;
  streak: number;
}

export interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  users: AuthUser[];
}

export type AuthAction =
  | { type: 'LOGIN'; payload: AuthUser }
  | { type: 'LOGIN_GUEST' }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; payload: AuthUser }
  | { type: 'UPDATE_PROFILE'; payload: Partial<AuthUser> }
  | { type: 'ADMIN_UPDATE_USER'; payload: AuthUser }
  | { type: 'ADMIN_DELETE_USER'; payload: string }
  | { type: 'ADMIN_TOGGLE_USER'; payload: string }
  | { type: 'LOAD_AUTH'; payload: AuthState };
