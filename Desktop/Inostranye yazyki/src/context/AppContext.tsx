import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, User, Dictionary, Flashcard, LanguageCode, Word, StudySession } from '../types';
import { defaultUser, sampleDictionaries, generateFlashcardsFromDictionary } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LANGUAGE'; payload: LanguageCode }
  | { type: 'ADD_DICTIONARY'; payload: Dictionary }
  | { type: 'UPDATE_DICTIONARY'; payload: Dictionary }
  | { type: 'DELETE_DICTIONARY'; payload: string }
  | { type: 'SET_FLASHCARDS'; payload: Flashcard[] }
  | { type: 'UPDATE_FLASHCARD'; payload: Flashcard }
  | { type: 'ADD_FLASHCARD'; payload: Flashcard }
  | { type: 'ADD_WORD_TO_DICTIONARY'; payload: { dictionaryId: string; word: Word } }
  | { type: 'DELETE_WORD'; payload: { dictionaryId: string; wordId: string } }
  | { type: 'COMPLETE_SESSION'; payload: StudySession }
  | { type: 'LOAD_STATE'; payload: AppState };

const initialState: AppState = {
  user: defaultUser,
  currentLanguage: 'en',
  dictionaries: sampleDictionaries,
  flashcards: sampleDictionaries.flatMap(d => generateFlashcardsFromDictionary(d)),
  activeSession: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'UPDATE_USER':
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };

    case 'ADD_DICTIONARY': {
      const newCards = generateFlashcardsFromDictionary(action.payload);
      return {
        ...state,
        dictionaries: [...state.dictionaries, action.payload],
        flashcards: [...state.flashcards, ...newCards],
      };
    }

    case 'UPDATE_DICTIONARY':
      return {
        ...state,
        dictionaries: state.dictionaries.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };

    case 'DELETE_DICTIONARY':
      return {
        ...state,
        dictionaries: state.dictionaries.filter(d => d.id !== action.payload),
        flashcards: state.flashcards.filter(f => !f.id.startsWith(`fc-${action.payload}`)),
      };

    case 'SET_FLASHCARDS':
      return { ...state, flashcards: action.payload };

    case 'UPDATE_FLASHCARD':
      return {
        ...state,
        flashcards: state.flashcards.map(f =>
          f.id === action.payload.id ? action.payload : f
        ),
      };

    case 'ADD_FLASHCARD':
      return { ...state, flashcards: [...state.flashcards, action.payload] };

    case 'ADD_WORD_TO_DICTIONARY': {
      const updatedDicts = state.dictionaries.map(d => {
        if (d.id !== action.payload.dictionaryId) return d;
        return { ...d, words: [...d.words, action.payload.word] };
      });
      const newCard: Flashcard = {
        id: `fc-${action.payload.dictionaryId}-${action.payload.word.id}`,
        wordId: action.payload.word.id,
        word: action.payload.word,
        status: 'new',
        nextReviewDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        easeFactor: 2.5,
        interval: 1,
        addedAt: new Date().toISOString(),
      };
      return {
        ...state,
        dictionaries: updatedDicts,
        flashcards: [...state.flashcards, newCard],
      };
    }

    case 'DELETE_WORD': {
      const updatedDicts = state.dictionaries.map(d => {
        if (d.id !== action.payload.dictionaryId) return d;
        return { ...d, words: d.words.filter(w => w.id !== action.payload.wordId) };
      });
      return {
        ...state,
        dictionaries: updatedDicts,
        flashcards: state.flashcards.filter(
          f => !(f.wordId === action.payload.wordId && f.id.includes(action.payload.dictionaryId))
        ),
      };
    }

    case 'COMPLETE_SESSION': {
      if (!state.user) return state;
      const session = action.payload;
      const updatedLanguages = state.user.learningLanguages.map(l => {
        if (l.language !== session.language) return l;
        const totalCards = l.studySessions.reduce((s, ss) => s + ss.cardsStudied, 0) + session.cardsStudied;
        const totalCorrect = l.studySessions.reduce((s, ss) => s + ss.correctAnswers, 0) + session.correctAnswers;
        return {
          ...l,
          xp: l.xp + session.xpEarned,
          wordsLearned: l.wordsLearned + Math.floor(session.correctAnswers / 3),
          accuracy: Math.round((totalCorrect / totalCards) * 100),
          studySessions: [...l.studySessions, session],
        };
      });
      const today = new Date().toISOString().split('T')[0];
      const lastDate = state.user.lastStudyDate;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = lastDate === yesterday || lastDate === today
        ? (lastDate === today ? state.user.streak : state.user.streak + 1)
        : 1;
      return {
        ...state,
        user: {
          ...state.user,
          learningLanguages: updatedLanguages,
          totalXP: state.user.totalXP + session.xpEarned,
          streak: newStreak,
          lastStudyDate: today,
        },
      };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addDictionary: (name: string, description: string, language: LanguageCode, level: string, tags: string[], color: string) => void;
  addWordToDictionary: (dictionaryId: string, word: Omit<Word, 'id'>) => void;
  updateFlashcardAfterReview: (cardId: string, correct: boolean) => void;
  completeStudySession: (language: LanguageCode, cardsStudied: number, correctAnswers: number, duration: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('linguaai-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('linguaai-state', JSON.stringify(state));
  }, [state]);

  const addDictionary = (
    name: string, description: string, language: LanguageCode,
    level: string, tags: string[], color: string
  ) => {
    const dict: Dictionary = {
      id: uuidv4(),
      name, description, language,
      nativeLanguage: language,
      level: level as any,
      words: [],
      isPublic: false,
      createdBy: state.user?.id || 'user',
      createdAt: new Date().toISOString(),
      tags,
      coverColor: color,
    };
    dispatch({ type: 'ADD_DICTIONARY', payload: dict });
  };

  const addWordToDictionary = (dictionaryId: string, word: Omit<Word, 'id'>) => {
    const newWord: Word = { ...word, id: uuidv4() };
    dispatch({ type: 'ADD_WORD_TO_DICTIONARY', payload: { dictionaryId, word: newWord } });
  };

  const updateFlashcardAfterReview = (cardId: string, correct: boolean) => {
    const card = state.flashcards.find(f => f.id === cardId);
    if (!card) return;

    let { easeFactor, interval, reviewCount, correctCount, incorrectCount } = card;
    reviewCount++;

    if (correct) {
      correctCount++;
      if (interval === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      easeFactor = Math.max(1.3, easeFactor + 0.1);
    } else {
      incorrectCount++;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReviewDate = new Date(Date.now() + interval * 86400000).toISOString();
    const status = correctCount >= 5 && easeFactor >= 2.5 ? 'mastered'
      : reviewCount >= 2 ? 'review'
      : 'learning';

    dispatch({
      type: 'UPDATE_FLASHCARD',
      payload: { ...card, easeFactor, interval, reviewCount, correctCount, incorrectCount, nextReviewDate, status },
    });
  };

  const completeStudySession = (
    language: LanguageCode, cardsStudied: number, correctAnswers: number, duration: number
  ) => {
    const xpEarned = Math.round(correctAnswers * 5 + duration * 2);
    const session: StudySession = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      language,
      cardsStudied,
      correctAnswers,
      duration,
      xpEarned,
    };
    dispatch({ type: 'COMPLETE_SESSION', payload: session });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addDictionary, addWordToDictionary, updateFlashcardAfterReview, completeStudySession }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
