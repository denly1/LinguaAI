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
  courses: [],
  tests: [],
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

  // Загружаем курсы с бэка
  useEffect(() => {
    apiGetAllCourses()
      .then(res => {
        if (res.courses.length > 0) {
          const apiCourses = res.courses.map(apiCourseToLocal);
          const localOnly = state.courses.filter(c => !apiCourses.find(a => a.id === c.id));
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
