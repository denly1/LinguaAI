import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import Dashboard from './pages/Dashboard';
import Flashcards from './pages/Flashcards';
import Dictionaries from './pages/Dictionaries';
import AITutor from './pages/AITutor';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import ManagerPanel from './pages/ManagerPanel';
import Courses from './pages/Courses';
import Games from './pages/Games';
import MatchingGame from './pages/MatchingGame';
import SpeedRound from './pages/SpeedRound';
import Landing from './pages/Landing';
import ErrorAnalysis from './pages/ErrorAnalysis';
import VoiceTrainer from './pages/VoiceTrainer';
import Notifications from './pages/Notifications';
import { ToastProvider } from './components/Toast/Toast';
import { CoursesProvider, useCourses } from './context/CoursesContext';
import './App.css';

const GuestBlock: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, padding: 32 }}>
      <div style={{ fontSize: 56 }}>�</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}>Раздел доступен после регистрации</h2>
      <p style={{ color:'var(--text-muted)', textAlign:'center', maxWidth:380, fontSize: 15, lineHeight: 1.6 }}>
        Создайте аккаунт и купите курс, чтобы получить полный доступ ко всем функциям платформы.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/auth')}
          style={{ background:'var(--brand, #4a6cf7)', color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}
        >
          Войти / Зарегистрироваться
        </button>
        <button
          onClick={() => navigate('/courses')}
          style={{ background:'var(--bg-card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }}
        >
          Посмотреть курсы
        </button>
      </div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { isManager, isAdmin, isGuest, authState } = useAuth();
  const { loadUserPurchases } = useCourses();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const uid = authState.currentUser?.id;
    if (uid && uid !== 'guest') loadUserPurchases(uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.currentUser?.id]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('linguaai-theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('linguaai-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('.topbar-search-btn')?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed(c => !c);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={`app-layout theme-${theme}`} data-theme={theme}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="app-content">
        <Topbar theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
        <main className="app-main">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/flashcards" element={isGuest ? <GuestBlock /> : <Flashcards />} />
            <Route path="/dictionaries" element={isGuest ? <GuestBlock /> : <Dictionaries />} />
            <Route path="/ai-tutor" element={isGuest ? <GuestBlock /> : <AITutor />} />
            <Route path="/progress" element={isGuest ? <GuestBlock /> : <Progress />} />
            <Route path="/settings" element={isGuest ? <GuestBlock /> : <Settings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/games" element={isGuest ? <GuestBlock /> : <Games />} />
            <Route path="/games/matching" element={isGuest ? <GuestBlock /> : <MatchingGame />} />
            <Route path="/games/speed" element={isGuest ? <GuestBlock /> : <SpeedRound />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/error-analysis" element={isGuest ? <GuestBlock /> : <ErrorAnalysis />} />
            <Route path="/voice-trainer" element={isGuest ? <GuestBlock /> : <VoiceTrainer />} />
            <Route path="/notifications" element={isGuest ? <GuestBlock /> : <Notifications />} />
            <Route
              path="/manager"
              element={isManager ? <ManagerPanel /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/admin"
              element={isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AppInner: React.FC = () => {
  const { isGuest } = useAuth();
  const [theme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('linguaai-theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isGuest ? 'dark' : theme);
  }, [theme, isGuest]);

  return (
    <Routes>
      {/* Public routes — no sidebar */}
      <Route path="/" element={isGuest ? <Landing /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={isGuest ? <Auth /> : <Navigate to="/dashboard" replace />} />

      {/* App routes — with sidebar+topbar */}
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppProvider>
      <CoursesProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </ToastProvider>
      </CoursesProvider>
    </AppProvider>
  </AuthProvider>
);

export default App;
