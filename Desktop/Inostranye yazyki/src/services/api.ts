const BASE = 'http://localhost:3001/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const apiLogin = (email: string, password: string) =>
  request<{ success: boolean; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const apiRegister = (name: string, email: string, password: string) =>
  request<{ success: boolean; user: ApiUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

// ── Users ────────────────────────────────────────────────────────────────────
export const apiGetUsers = () =>
  request<{ success: boolean; users: ApiUser[] }>('/users');

export const apiUpdateUserRole = (id: string, role: string) =>
  request<{ success: boolean }>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const apiToggleUserActive = (id: string, is_active: boolean) =>
  request<{ success: boolean }>(`/users/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  });

// ── Courses ──────────────────────────────────────────────────────────────────
export const apiGetCourses = () =>
  request<{ success: boolean; courses: ApiCourse[] }>('/courses');

export const apiGetAllCourses = () =>
  request<{ success: boolean; courses: ApiCourse[] }>('/courses/all');

export const apiCreateCourse = (data: Partial<ApiCourse>) =>
  request<{ success: boolean; course: ApiCourse }>('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiUpdateCourseStatus = (id: string, status: string) =>
  request<{ success: boolean }>(`/courses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ── Purchases ────────────────────────────────────────────────────────────────
export const apiGetPurchases = (userId: string) =>
  request<{ success: boolean; purchases: ApiPurchase[] }>(`/purchases/${userId}`);

export const apiCreatePurchase = (data: {
  user_id: string;
  course_id: string;
  tier: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  card_last_four: string;
}) =>
  request<{ success: boolean; purchase: ApiPurchase }>('/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ── Types ────────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'user' | 'manager' | 'admin';
  is_active: boolean;
  total_xp: number;
  streak: number;
  avatar: string | null;
  created_at: string;
  last_login: string;
}

export interface ApiCourse {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string; // БД: upper_intermediate, фронт: upper-intermediate
  tier: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  cover_color: string;
  emoji: string;
  features: string[];
  total_students: number;
  rating: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiPurchase {
  id: string;
  user_id: string;
  course_id: string;
  tier: string;
  amount: number;
  status: string;
  payer_name: string;
  payer_email: string;
  card_last_four: string;
  created_at: string;
  confirmed_at: string;
  title?: string;
  emoji?: string;
}
