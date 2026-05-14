import React, { useState } from 'react';
import { Users, Shield, BarChart2, Trash2, Edit3, Check, X, Crown, UserCheck, User as UserIcon, TrendingUp, Activity, Database, Search, Filter, Lock, Unlock, Eye, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthUser, UserRole } from '../types/auth';
import './AdminPanel.css';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.FC<any> }> = {
  admin: { label: 'Администратор', color: '#f87171', bg: 'rgba(239,68,68,0.12)', icon: Crown },
  manager: { label: 'Менеджер', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: UserCheck },
  user: { label: 'Пользователь', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', icon: UserIcon },
  guest: { label: 'Гость', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: UserIcon },
};

const STUB = false;

const AdminPanel: React.FC = () => {
  const { authState, authDispatch, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'system' | 'permissions'>('users');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [viewingUser, setViewingUser] = useState<AuthUser | null>(null);

  if (STUB) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Администрирование</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, color: '#9ca3af', fontSize: 14 }}>
        Функция недоступна
      </div>
    </div>
  );

  const users = authState.users.filter(u => {
    if (u.id === 'guest' || u.role === 'guest') return false;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalUsers = authState.users.length;
  const activeUsers = authState.users.filter(u => u.isActive).length;
  const adminCount = authState.users.filter(u => u.role === 'admin').length;
  const totalXP = authState.users.reduce((a, u) => a + u.totalXP, 0);

  const startEdit = (user: AuthUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const saveEdit = () => {
    if (!editingUser) return;
    authDispatch({
      type: 'ADMIN_UPDATE_USER',
      payload: { ...editingUser, name: editName, role: editRole },
    });
    setEditingUser(null);
  };

  const deleteUser = (userId: string) => {
    if (!isAdmin) return;
    if (window.confirm('Удалить пользователя? Это действие необратимо.')) {
      authDispatch({ type: 'ADMIN_DELETE_USER', payload: userId });
    }
  };

  const toggleUser = (userId: string) => {
    const target = authState.users.find(u => u.id === userId);
    if (!target) return;
    if (target.role === 'admin' && !isAdmin) return;
    authDispatch({ type: 'ADMIN_TOGGLE_USER', payload: userId });
  };

  const canEdit = (target: AuthUser) => {
    if (target.id === authState.currentUser?.id) return false;
    if (target.role === 'admin' && !isAdmin) return false;
    return true;
  };

  const canDelete = (target: AuthUser) => {
    if (!isAdmin) return false;
    if (target.id === authState.currentUser?.id) return false;
    return true;
  };

  const canToggle = (target: AuthUser) => {
    if (target.id === authState.currentUser?.id) return false;
    if (target.role === 'admin' && !isAdmin) return false;
    return true;
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1><Shield size={22} /> Панель администратора</h1>
          <p className="admin-subtitle">Управление пользователями и системой LinguaAI</p>
        </div>
        <div className="admin-role-badge">
          <Crown size={14} />
          {isAdmin ? 'Администратор' : 'Менеджер'}
        </div>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon users"><Users size={20} /></div>
          <div className="admin-stat-val">{totalUsers}</div>
          <div className="admin-stat-lbl">Всего пользователей</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon active"><Activity size={20} /></div>
          <div className="admin-stat-val">{activeUsers}</div>
          <div className="admin-stat-lbl">Активных</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admins"><Crown size={20} /></div>
          <div className="admin-stat-val">{adminCount}</div>
          <div className="admin-stat-lbl">Администраторов</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon xp"><TrendingUp size={20} /></div>
          <div className="admin-stat-val">{(totalXP / 1000).toFixed(1)}k</div>
          <div className="admin-stat-lbl">Суммарный XP</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={15} /> Пользователи
        </button>
        <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <BarChart2 size={15} /> Статистика
        </button>
        <button className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
          <Shield size={15} /> Права доступа
        </button>
        {isAdmin && (
          <button className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
            <Database size={15} /> Система
          </button>
        )}
      </div>

      {activeTab === 'users' && (
        <div className="admin-users-section">
          <div className="admin-controls">
            <div className="admin-search">
              <Search size={15} />
              <input
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter">
              <Filter size={14} />
              {(['all', 'admin', 'manager', 'user'] as const).map(r => (
                <button
                  key={r}
                  className={`filter-chip ${filterRole === r ? 'active' : ''}`}
                  onClick={() => setFilterRole(r)}
                >
                  {r === 'all' ? 'Все' : ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-users-table">
            <div className="table-header">
              <span>Пользователь</span>
              <span>Роль</span>
              <span>XP</span>
              <span>Серия</span>
              <span>Последний вход</span>
              <span>Статус</span>
              <span>Действия</span>
            </div>
            {users.map(user => (
              <div key={user.id} className={`table-row ${!user.isActive ? 'inactive' : ''} ${user.id === authState.currentUser?.id ? 'current-user-row' : ''}`}>
                {editingUser?.id === user.id ? (
                  <>
                    <div className="user-cell-edit">
                      <div className="user-avatar-sm" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[editRole].color}, #6366f1)` }}>
                        {editName.charAt(0)}
                      </div>
                      <div>
                        <input
                          className="edit-input"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div>
                      <select
                        className="role-select"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        disabled={!isAdmin}
                      >
                        <option value="user">Пользователь</option>
                        <option value="manager">Менеджер</option>
                        {isAdmin && <option value="admin">Администратор</option>}
                      </select>
                      {!isAdmin && <div style={{fontSize:11,color:'#f59e0b',marginTop:4}}><Lock size={10}/> Только администратор может менять роли</div>}
                    </div>
                    <div>{user.totalXP.toLocaleString()}</div>
                    <div>🔥 {user.streak}</div>
                    <div>{new Date(user.lastLogin).toLocaleDateString('ru')}</div>
                    <div />
                    <div className="action-btns">
                      <button className="action-btn save" onClick={saveEdit}><Check size={14} /></button>
                      <button className="action-btn cancel" onClick={() => setEditingUser(null)}><X size={14} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-cell">
                      <div className="user-avatar-sm" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[user.role].color}, #6366f1)` }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name-cell">
                          {user.name}
                          {user.id === authState.currentUser?.id && <span className="you-badge">Вы</span>}
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div>
                      <span className="role-badge" style={{ color: ROLE_CONFIG[user.role].color, background: ROLE_CONFIG[user.role].bg }}>
                        {React.createElement(ROLE_CONFIG[user.role].icon, { size: 11 })}
                        {ROLE_CONFIG[user.role].label}
                      </span>
                    </div>
                    <div className="xp-cell">{user.totalXP.toLocaleString()}</div>
                    <div>🔥 {user.streak}</div>
                    <div className="date-cell">{new Date(user.lastLogin).toLocaleDateString('ru')}</div>
                    <div>
                      <span className={`status-badge ${user.isActive ? 'active' : 'blocked'}`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </div>
                    <div className="action-btns">
                      <button
                        className="action-btn view"
                        onClick={() => setViewingUser(viewingUser?.id === user.id ? null : user)}
                        title="Подробнее"
                      >
                        <Eye size={14} />
                      </button>
                      {canEdit(user) && (
                        <button className="action-btn edit" onClick={() => startEdit(user)} title="Редактировать">
                          <Edit3 size={14} />
                        </button>
                      )}
                      {canToggle(user) && (
                        <button
                          className={`action-btn toggle ${user.isActive ? 'block' : 'unblock'}`}
                          onClick={() => toggleUser(user.id)}
                          title={user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        >
                          {user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      )}
                      {canDelete(user) && (
                        <button className="action-btn delete" onClick={() => deleteUser(user.id)} title="Удалить">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
                {viewingUser?.id === user.id && (
                  <div className="user-detail-panel">
                    <div className="udp-row"><span>ID:</span><code>{user.id}</code></div>
                    <div className="udp-row"><span>Email:</span>{user.email}</div>
                    <div className="udp-row"><span>Зарегистрирован:</span>{new Date(user.createdAt).toLocaleDateString('ru')}</div>
                    <div className="udp-row"><span>Последний вход:</span>{new Date(user.lastLogin).toLocaleDateString('ru')}</div>
                    <div className="udp-row"><span>Суммарный XP:</span>{user.totalXP.toLocaleString()}</div>
                    <div className="udp-row"><span>Серия:</span>🔥 {user.streak} дней</div>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="table-empty">Пользователи не найдены</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="admin-stats-section">
          <div className="stats-cards-grid">
            <div className="stats-detail-card">
              <h3>Распределение по ролям</h3>
              <div className="role-distribution">
                {(['admin', 'manager', 'user'] as UserRole[]).map(role => {
                  const count = authState.users.filter(u => u.role === role).length;
                  const pct = totalUsers > 0 ? (count / totalUsers * 100) : 0;
                  return (
                    <div key={role} className="role-dist-item">
                      <div className="role-dist-label">
                        <span style={{ color: ROLE_CONFIG[role].color }}>{ROLE_CONFIG[role].label}</span>
                        <span>{count}</span>
                      </div>
                      <div className="role-dist-bar">
                        <div className="role-dist-fill" style={{ width: `${pct}%`, background: ROLE_CONFIG[role].color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stats-detail-card">
              <h3>Топ по XP</h3>
              <div className="top-xp-list">
                {[...authState.users].sort((a, b) => b.totalXP - a.totalXP).slice(0, 5).map((u, i) => (
                  <div key={u.id} className="top-xp-item">
                    <div className="top-rank">{i + 1}</div>
                    <div className="top-avatar" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[u.role].color}, #6366f1)` }}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="top-name">{u.name}</div>
                    <div className="top-xp">{u.totalXP.toLocaleString()} XP</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-detail-card">
              <h3>Активность за 7 дней</h3>
              <div className="activity-placeholder">
                <div className="activity-bars">
                  {[65, 80, 45, 90, 70, 55, 85].map((h, i) => (
                    <div key={i} className="activity-bar-col">
                      <div className="activity-bar-fill" style={{ height: `${h}%` }} />
                      <div className="activity-bar-day">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="stats-detail-card">
              <h3>Статистика серий</h3>
              <div className="streak-stats">
                <div className="streak-stat">
                  <div className="streak-val">{Math.max(...authState.users.map(u => u.streak))}</div>
                  <div className="streak-lbl">Макс. серия</div>
                </div>
                <div className="streak-stat">
                  <div className="streak-val">
                    {Math.round(authState.users.reduce((a, u) => a + u.streak, 0) / (authState.users.length || 1))}
                  </div>
                  <div className="streak-lbl">Средняя серия</div>
                </div>
                <div className="streak-stat">
                  <div className="streak-val">{authState.users.filter(u => u.streak >= 7).length}</div>
                  <div className="streak-lbl">≥7 дней</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="admin-permissions-section">
          {!isAdmin && (
            <div className="perm-notice">
              <AlertTriangle size={16} />
              Вы вошли как <strong>Менеджер</strong>. Некоторые действия недоступны. Только администратор может менять роли и удалять пользователей.
            </div>
          )}
          <div className="perm-matrix">
            <div className="perm-matrix-header">
              <div className="perm-feature-col">Функция</div>
              <div className="perm-role-col" style={{color: ROLE_CONFIG.user.color}}>Пользователь</div>
              <div className="perm-role-col" style={{color: ROLE_CONFIG.manager.color}}>Менеджер</div>
              <div className="perm-role-col" style={{color: ROLE_CONFIG.admin.color}}>Администратор</div>
            </div>
            {([
              { feature: 'Изучение карточек', user: true, manager: true, admin: true },
              { feature: 'Словари (создание)', user: true, manager: true, admin: true },
              { feature: 'Экспорт / Импорт CSV', user: true, manager: true, admin: true },
              { feature: 'Тьютор', user: true, manager: true, admin: true },
              { feature: 'Игры', user: true, manager: true, admin: true },
              { feature: 'Таблица лидеров', user: true, manager: true, admin: true },
              { feature: 'Свой прогресс', user: true, manager: true, admin: true },
              { feature: 'Просмотр пользователей', user: false, manager: true, admin: true },
              { feature: 'Блокировка пользователей', user: false, manager: true, admin: true },
              { feature: 'Просмотр статистики системы', user: false, manager: true, admin: true },
              { feature: 'Редактирование имени пользователя', user: false, manager: true, admin: true },
              { feature: 'Изменение ролей', user: false, manager: false, admin: true },
              { feature: 'Удаление пользователей', user: false, manager: false, admin: true },
              { feature: 'Системные настройки', user: false, manager: false, admin: true },
              { feature: 'Очистка данных', user: false, manager: false, admin: true },
            ]).map(({ feature, user, manager, admin }) => (
              <div key={feature} className="perm-matrix-row">
                <div className="perm-feature-col">{feature}</div>
                <div className="perm-role-col">{user ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}</div>
                <div className="perm-role-col">{manager ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}</div>
                <div className="perm-role-col">{admin ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}</div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="perm-role-cards">
              <h3><Info size={15}/> Быстрое назначение роли</h3>
              <div className="perm-quick-assign">
                {authState.users.filter(u => u.id !== authState.currentUser?.id).map(u => (
                  <div key={u.id} className="perm-assign-row">
                    <div className="user-avatar-sm" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[u.role].color}, #6366f1)` }}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="perm-assign-name">
                      <div>{u.name}</div>
                      <div style={{fontSize:11, color:'#6b7280'}}>{u.email}</div>
                    </div>
                    <select
                      className="role-select"
                      value={u.role}
                      onChange={e => authDispatch({ type: 'ADMIN_UPDATE_USER', payload: { ...u, role: e.target.value as UserRole } })}
                    >
                      <option value="user">Пользователь</option>
                      <option value="manager">Менеджер</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="admin-system-section">
          <div className="system-cards">
            <div className="system-card">
              <div className="system-card-icon"><Database size={20} /></div>
              <h3>LocalStorage</h3>
              <div className="system-info-rows">
                <div className="system-info-row">
                  <span>Данные авторизации</span>
                  <span className="sys-val">{(JSON.stringify(authState).length / 1024).toFixed(1)} KB</span>
                </div>
                <div className="system-info-row">
                  <span>Состояние приложения</span>
                  <span className="sys-val">—</span>
                </div>
              </div>
              <button className="sys-btn danger" onClick={() => {
                if (window.confirm('Очистить все данные? (Это не удалит аккаунты)')) {
                  localStorage.removeItem('linguaai-state');
                  window.location.reload();
                }
              }}>
                Очистить данные обучения
              </button>
            </div>

            <div className="system-card">
              <div className="system-card-icon version"><Shield size={20} /></div>
              <h3>О системе</h3>
              <div className="system-info-rows">
                <div className="system-info-row"><span>Версия</span><span className="sys-val">1.0.0</span></div>
                <div className="system-info-row"><span>React</span><span className="sys-val">18.2</span></div>
                <div className="system-info-row"><span>TypeScript</span><span className="sys-val">4.9</span></div>
                <div className="system-info-row"><span>Пользователей</span><span className="sys-val">{totalUsers}</span></div>
              </div>
            </div>

            <div className="system-card">
              <div className="system-card-icon roles"><Crown size={20} /></div>
              <h3>Права доступа</h3>
              <div className="permissions-list">
                {([
                  { role: 'admin', perms: ['Все права', 'Управление ролями', 'Удаление пользователей', 'Системные настройки'] },
                  { role: 'manager', perms: ['Просмотр всех пользователей', 'Блокировка пользователей', 'Просмотр статистики'] },
                  { role: 'user', perms: ['Учёба', 'Личный прогресс', 'Свои словари и карточки'] },
                ] as { role: UserRole; perms: string[] }[]).map(({ role, perms }) => (
                  <div key={role} className="perm-group">
                    <div className="perm-role" style={{ color: ROLE_CONFIG[role].color }}>
                      {ROLE_CONFIG[role].label}
                    </div>
                    {perms.map(p => (
                      <div key={p} className="perm-item"><Check size={11} color="#10b981" />{p}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
