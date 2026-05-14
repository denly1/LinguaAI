export type LanguageCode = 'en' | 'fr' | 'zh';

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced';

export type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  nativeLanguage: LanguageCode;
  learningLanguages: LearningProgress[];
  totalXP: number;
  streak: number;
  lastStudyDate: string;
  joinedAt: string;
  dailyGoal?: number;
  notificationsEnabled?: boolean;
}

export interface LearningProgress {
  language: LanguageCode;
  level: DifficultyLevel;
  xp: number;
  wordsLearned: number;
  accuracy: number;
  studySessions: StudySession[];
}

export interface StudySession {
  id: string;
  date: string;
  language: LanguageCode;
  cardsStudied: number;
  correctAnswers: number;
  duration: number;
  xpEarned: number;
}

export interface Word {
  id: string;
  term: string;
  translation: string;
  language: LanguageCode;
  nativeLanguage: LanguageCode;
  phonetic?: string;
  partOfSpeech?: string;
  examples: string[];
  tags: string[];
  imageUrl?: string;
  audioUrl?: string;
  difficulty: DifficultyLevel;
  frequency?: number;
}

export interface Flashcard {
  id: string;
  wordId: string;
  word: Word;
  status: CardStatus;
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  easeFactor: number;
  interval: number;
  addedAt: string;
}

export interface Dictionary {
  id: string;
  name: string;
  description: string;
  language: LanguageCode;
  nativeLanguage: LanguageCode;
  level: DifficultyLevel;
  words: Word[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  tags: string[];
  coverColor: string;
}

export interface AIRecommendation {
  type: 'word' | 'dictionary' | 'exercise' | 'tip' | 'review';
  title: string;
  description: string;
  data?: any;
  reason: string;
  priority: number;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  word: Word;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export type ExerciseType = 'multiple-choice' | 'typing' | 'matching' | 'fill-blank';

export interface AppState {
  user: User | null;
  currentLanguage: LanguageCode;
  dictionaries: Dictionary[];
  flashcards: Flashcard[];
  activeSession: StudySession | null;
}
