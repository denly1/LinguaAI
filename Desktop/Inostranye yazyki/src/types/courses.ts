import { LanguageCode, DifficultyLevel } from './index';

export type CourseTier = 'standard' | 'medium' | 'premium';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type PurchaseStatus = 'pending' | 'confirmed' | 'rejected';
export type TestQuestionType = 'multiple-choice' | 'typing' | 'true-false';
export type GameType = 'matching' | 'speed' | 'fill-blank' | 'word-order';

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  order: number;
  content: string;
  dictionaryId?: string;
  testId?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  language: LanguageCode;
  level: DifficultyLevel;
  tier: CourseTier;
  price: number;
  status: CourseStatus;
  coverColor: string;
  emoji: string;
  lessons: CourseLesson[];
  dictionaryIds: string[];
  testIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalStudents: number;
  rating: number;
  features: string[];
}

export interface TestQuestion {
  id: string;
  question: string;
  type: TestQuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  language: LanguageCode;
  level: DifficultyLevel;
  questions: TestQuestion[];
  timeLimit?: number;
  passingScore: number;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

export interface ManagedGame {
  id: string;
  title: string;
  description: string;
  type: GameType;
  language: LanguageCode;
  level: DifficultyLevel;
  dictionaryId?: string;
  wordPairs?: { term: string; translation: string }[];
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  tier: CourseTier;
  amount: number;
  status: PurchaseStatus;
  payerName: string;
  payerEmail: string;
  cardLastFour: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const TIER_CONFIG: Record<CourseTier, {
  label: string;
  color: string;
  bg: string;
  emoji: string;
  description: string;
}> = {
  standard: {
    label: 'Standard',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.1)',
    emoji: '📘',
    description: 'Базовый доступ к курсу',
  },
  medium: {
    label: 'Medium',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.1)',
    emoji: '📗',
    description: 'Расширенный контент + тесты',
  },
  premium: {
    label: 'Premium',
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.1)',
    emoji: '⭐',
    description: 'Полный доступ + тьютор + сертификат',
  },
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'Английский',
  de: 'Немецкий',
  fr: 'Французский',
  es: 'Испанский',
  it: 'Итальянский',
  zh: 'Китайский',
  ja: 'Японский',
  pt: 'Португальский',
};
