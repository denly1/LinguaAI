import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Course, Test, ManagedGame, Purchase, CourseTier, CourseReview } from '../types/courses';
import { v4 as uuidv4 } from 'uuid';
import { apiGetAllCourses, apiGetPurchases, apiCreatePurchase, ApiCourse, ApiPurchase } from '../services/api';

interface CoursesState {
  courses: Course[];
  tests: Test[];
  games: ManagedGame[];
  purchases: Purchase[];
  reviews: CourseReview[];
}

type CoursesAction =
  | { type: 'LOAD'; payload: CoursesState }
  | { type: 'ADD_COURSE'; payload: Course }
  | { type: 'UPDATE_COURSE'; payload: Course }
  | { type: 'DELETE_COURSE'; payload: string }
  | { type: 'ADD_TEST'; payload: Test }
  | { type: 'UPDATE_TEST'; payload: Test }
  | { type: 'DELETE_TEST'; payload: string }
  | { type: 'ADD_GAME'; payload: ManagedGame }
  | { type: 'UPDATE_GAME'; payload: ManagedGame }
  | { type: 'DELETE_GAME'; payload: string }
  | { type: 'ADD_PURCHASE'; payload: Purchase }
  | { type: 'UPDATE_PURCHASE_STATUS'; payload: { id: string; status: Purchase['status'] } }
  | { type: 'ADD_REVIEW'; payload: CourseReview };

const DEMO_COURSES: Course[] = [
  {
    id: 'course-en-standard',
    title: 'Английский для начинающих',
    description: 'Базовый курс английского языка. Освоите 500+ слов, грамматику A1-A2, научитесь строить простые предложения и вести базовый диалог.',
    language: 'en',
    level: 'beginner',
    tier: 'standard',
    price: 990,
    status: 'published',
    coverColor: '#3b82f6',
    emoji: '🇬🇧',
    lessons: [
      { id: 'l1', title: 'Приветствия и знакомство', description: 'Hello, my name is...', order: 1, content: 'Базовые фразы приветствия' },
      { id: 'l2', title: 'Числа и цвета', description: 'Numbers 1-100, basic colors', order: 2, content: 'Числа от 1 до 100 и основные цвета' },
      { id: 'l3', title: 'Глагол to be', description: 'I am, you are, he is...', order: 3, content: 'Спряжение глагола to be' },
    ],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    totalStudents: 234,
    rating: 4.6,
    features: ['500+ слов', '20 уроков', 'Флеш-карточки', 'Базовые тесты', 'Словарь A1-A2'],
  },
  {
    id: 'course-en-medium',
    title: 'Английский: средний уровень',
    description: 'Продолжите изучение английского с уровня A2 до B1. Расширенная лексика, времена глаголов, разговорные темы и практика с персональным тьютором.',
    language: 'en',
    level: 'intermediate',
    tier: 'medium',
    price: 1990,
    status: 'published',
    coverColor: '#8b5cf6',
    emoji: '🇬🇧',
    lessons: [
      { id: 'l4', title: 'Времена глаголов', description: 'Present, Past, Future', order: 1, content: 'Все основные времена английского' },
      { id: 'l5', title: 'Бизнес-лексика', description: 'Office vocabulary', order: 2, content: 'Словарный запас для офисной среды' },
    ],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    totalStudents: 156,
    rating: 4.8,
    features: ['1000+ слов', '35 уроков', 'Флеш-карточки', 'Расширенные тесты', 'Тьютор', 'Разговорные темы', 'Словарь A2-B1'],
  },
  {
    id: 'course-en-premium',
    title: 'Английский: полный курс Premium',
    description: 'Полный курс от A1 до B2+. Персональный тьютор, сертификат об окончании, безлимитные практики, еженедельные живые сессии и приоритетная поддержка.',
    language: 'en',
    level: 'upper-intermediate',
    tier: 'premium',
    price: 4990,
    status: 'published',
    coverColor: '#f59e0b',
    emoji: '🇬🇧',
    lessons: [],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    totalStudents: 89,
    rating: 4.9,
    features: ['3000+ слов', '80 уроков', 'Персональный тьютор', 'Живые сессии', 'Сертификат', 'Приоритетная поддержка', 'Безлимитные тесты', 'Словарь A1-B2+'],
  },
  {
    id: 'course-de-standard',
    title: 'Немецкий для начинающих',
    description: 'Начните изучение немецкого с нуля. Фонетика, базовая грамматика, 400+ слов и устойчивые фразы для повседневного общения.',
    language: 'de',
    level: 'beginner',
    tier: 'standard',
    price: 990,
    status: 'published',
    coverColor: '#ef4444',
    emoji: '🇩🇪',
    lessons: [],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
    totalStudents: 98,
    rating: 4.5,
    features: ['400+ слов', '18 уроков', 'Флеш-карточки', 'Базовые тесты', 'Словарь A1'],
  },
  {
    id: 'course-fr-medium',
    title: 'Французский: средний уровень',
    description: 'Продвинутый французский: лексика, грамматика subjonctif, французская культура и деловая переписка.',
    language: 'fr',
    level: 'intermediate',
    tier: 'medium',
    price: 1990,
    status: 'published',
    coverColor: '#10b981',
    emoji: '🇫🇷',
    lessons: [],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
    totalStudents: 67,
    rating: 4.7,
    features: ['900+ слов', '30 уроков', 'Флеш-карточки', 'Тесты', 'Тьютор', 'Деловой французский'],
  },
  {
    id: 'course-es-premium',
    title: 'Испанский: Premium полный курс',
    description: 'Полный курс испанского от нуля до уверенного B2. Латиноамериканский и испанский диалекты, культура, бизнес, туризм.',
    language: 'es',
    level: 'advanced',
    tier: 'premium',
    price: 4990,
    status: 'published',
    coverColor: '#f97316',
    emoji: '🇪🇸',
    lessons: [],
    dictionaryIds: [],
    testIds: [],
    createdBy: 'manager-1',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    totalStudents: 45,
    rating: 4.9,
    features: ['2500+ слов', '70 уроков', 'Тьютор', 'Живые сессии', 'Сертификат', 'Два диалекта', 'Приоритетная поддержка'],
  },
];

const DEMO_TESTS: Test[] = [
  {
    id: 'test-en-basics',
    title: 'Тест: Базовый английский',
    description: 'Проверка знаний базовой лексики и грамматики A1',
    language: 'en',
    level: 'beginner',
    passingScore: 70,
    timeLimit: 15,
    isPublic: true,
    createdBy: 'manager-1',
    createdAt: '2024-01-10T10:00:00Z',
    questions: [
      { id: 'q1', question: 'What is the translation of "Hello"?', type: 'multiple-choice', options: ['Привет', 'Пока', 'Спасибо', 'Пожалуйста'], correctAnswer: 'Привет' },
      { id: 'q2', question: 'Choose the correct form: "She ___ a student."', type: 'multiple-choice', options: ['am', 'is', 'are', 'be'], correctAnswer: 'is' },
      { id: 'q3', question: 'Translate: "I am happy"', type: 'typing', correctAnswer: 'Я счастлив' },
    ],
  },
];

function apiCourseToLocal(c: ApiCourse): Course {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    language: c.language as any,
    level: c.level.replace(/_/g, '-') as any,
    tier: c.tier as CourseTier,
    price: c.price,
    status: c.status,
    coverColor: c.cover_color,
    emoji: c.emoji,
    features: c.features || [],
    lessons: [],
    dictionaryIds: [],
    testIds: [],
    createdBy: c.created_by,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    totalStudents: c.total_students,
    rating: c.rating,
  };
}

function apiPurchaseToLocal(p: ApiPurchase): Purchase {
  return {
    id: p.id,
    userId: p.user_id,
    courseId: p.course_id,
    tier: p.tier as CourseTier,
    amount: p.amount,
    status: 'confirmed',
    payerName: p.payer_name,
    payerEmail: p.payer_email,
    cardLastFour: p.card_last_four,
    createdAt: p.created_at,
    confirmedAt: p.confirmed_at,
  };
}

const initialState: CoursesState = {
  courses: DEMO_COURSES,
  tests: DEMO_TESTS,
  games: [],
  purchases: [],
  reviews: [],
};

function reducer(state: CoursesState, action: CoursesAction): CoursesState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] };
    case 'UPDATE_COURSE':
      return { ...state, courses: state.courses.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_COURSE':
      return { ...state, courses: state.courses.filter(c => c.id !== action.payload) };
    case 'ADD_TEST':
      return { ...state, tests: [...state.tests, action.payload] };
    case 'UPDATE_TEST':
      return { ...state, tests: state.tests.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TEST':
      return { ...state, tests: state.tests.filter(t => t.id !== action.payload) };
    case 'ADD_GAME':
      return { ...state, games: [...state.games, action.payload] };
    case 'UPDATE_GAME':
      return { ...state, games: state.games.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GAME':
      return { ...state, games: state.games.filter(g => g.id !== action.payload) };
    case 'ADD_PURCHASE':
      return { ...state, purchases: [...state.purchases, action.payload] };
    case 'UPDATE_PURCHASE_STATUS':
      return {
        ...state,
        purchases: state.purchases.map(p =>
          p.id === action.payload.id
            ? { ...p, status: action.payload.status, confirmedAt: action.payload.status === 'confirmed' ? new Date().toISOString() : p.confirmedAt }
            : p
        ),
      };
    case 'ADD_REVIEW':
      return { ...state, reviews: [...state.reviews, action.payload] };
    default:
      return state;
  }
}

interface CoursesContextType {
  state: CoursesState;
  dispatch: React.Dispatch<CoursesAction>;
  purchaseCourse: (courseId: string, tier: CourseTier, userId: string, payerName: string, payerEmail: string, cardLastFour: string, amount: number) => Purchase;
  getUserPurchases: (userId: string) => Purchase[];
  hasPurchased: (userId: string, courseId: string) => boolean;
  loadUserPurchases: (userId: string) => void;
  addReview: (courseId: string, userId: string, userName: string, rating: number, comment: string) => void;
  getCourseReviews: (courseId: string) => CourseReview[];
  canReview: (userId: string, courseId: string) => boolean;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Загружаем курсы с бэка (полная замена DEMO если бэк доступен)
  useEffect(() => {
    apiGetAllCourses()
      .then(res => {
        if (res.courses.length > 0) {
          const apiCourses = res.courses.map(apiCourseToLocal);
          // Сохраняем менеджерские курсы созданные локально (не из DEMO и не из бэка)
          const demoCourseIds = DEMO_COURSES.map(d => d.id);
          const localOnly = state.courses.filter(
            c => !demoCourseIds.includes(c.id) && !apiCourses.find(a => a.id === c.id)
          );
          dispatch({ type: 'LOAD', payload: { ...state, courses: [...apiCourses, ...localOnly] } });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchaseCourse = (courseId: string, tier: CourseTier, userId: string, payerName: string, payerEmail: string, cardLastFour: string, amount: number): Purchase => {
    const localPurchase: Purchase = {
      id: uuidv4(),
      userId,
      courseId,
      tier,
      amount,
      status: 'confirmed',
      payerName,
      payerEmail,
      cardLastFour,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    // Сохраняем локально сразу (оптимистичное обновление)
    dispatch({ type: 'ADD_PURCHASE', payload: localPurchase });

    // Сохраняем на бэке асинхронно
    apiCreatePurchase({
      user_id: userId,
      course_id: courseId,
      tier,
      amount,
      payer_name: payerName,
      payer_email: payerEmail,
      card_last_four: cardLastFour,
    }).catch(err => console.error('Purchase API error:', err));

    // Отправка email-чека
    const course = state.courses.find(c => c.id === courseId);
    if (course && payerEmail) {
      fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: payerEmail,
          userName: payerName,
          course: { title: course.title, language: course.language, level: course.level, tier: course.tier, price: course.price },
          purchase: { id: localPurchase.id, purchasedAt: localPurchase.createdAt },
        }),
      }).catch(() => {});
    }

    return localPurchase;
  };

  // Загрузка покупок пользователя с бэка
  const loadUserPurchases = (userId: string) => {
    if (!userId || userId === 'guest') return;
    apiGetPurchases(userId)
      .then(res => {
        const purchases = res.purchases.map(apiPurchaseToLocal);
        purchases.forEach(p => {
          if (!state.purchases.find(existing => existing.id === p.id)) {
            dispatch({ type: 'ADD_PURCHASE', payload: p });
          }
        });
      })
      .catch(() => {});
  };

  const getUserPurchases = (userId: string) => state.purchases.filter(p => p.userId === userId);

  const hasPurchased = (userId: string, courseId: string) =>
    state.purchases.some(p => p.userId === userId && p.courseId === courseId && p.status === 'confirmed');

  const addReview = (courseId: string, userId: string, userName: string, rating: number, comment: string) => {
    const review: CourseReview = {
      id: uuidv4(),
      courseId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_REVIEW', payload: review });
  };

  const getCourseReviews = (courseId: string) => state.reviews.filter(r => r.courseId === courseId);

  const canReview = (userId: string, courseId: string) => {
    const purchased = hasPurchased(userId, courseId);
    const alreadyReviewed = state.reviews.some(r => r.userId === userId && r.courseId === courseId);
    return purchased && !alreadyReviewed;
  };

  return (
    <CoursesContext.Provider value={{ state, dispatch, purchaseCourse, getUserPurchases, hasPurchased, loadUserPurchases, addReview, getCourseReviews, canReview }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = (): CoursesContextType => {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error('useCourses must be used within CoursesProvider');
  return ctx;
};

export { uuidv4 };
export type { CourseReview };
