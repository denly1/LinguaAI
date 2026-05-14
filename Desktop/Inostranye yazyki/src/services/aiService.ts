import { Flashcard, Word, AIRecommendation, DifficultyLevel, LanguageCode, User } from '../types';

export function getAIRecommendations(user: User, flashcards: Flashcard[]): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  const langProgress = user.learningLanguages.find(l => l.language === user.learningLanguages[0]?.language);
  if (!langProgress) return recommendations;

  const dueCards = flashcards.filter(f => new Date(f.nextReviewDate) <= new Date());
  const newCards = flashcards.filter(f => f.status === 'new');
  const weakCards = flashcards.filter(f => {
    const total = f.correctCount + f.incorrectCount;
    return total > 0 && f.incorrectCount / total > 0.4;
  });

  if (dueCards.length > 0) {
    recommendations.push({
      type: 'exercise',
      title: `Повторить ${dueCards.length} карточек`,
      description: `У вас есть ${dueCards.length} карточек, которые пора повторить по расписанию интервального повторения.`,
      reason: 'Интервальное повторение повышает долгосрочное запоминание на 80%',
      priority: 10,
      data: { cardIds: dueCards.slice(0, 20).map(c => c.id) },
    });
  }

  if (weakCards.length > 0) {
    recommendations.push({
      type: 'exercise',
      title: `Проработать слабые места (${weakCards.length} слов)`,
      description: `Эти слова вызывают затруднения — рекомендуем уделить им особое внимание.`,
      reason: `Точность ниже 60% для ${weakCards.length} слов`,
      priority: 9,
      data: { cardIds: weakCards.map(c => c.id) },
    });
  }

  if (newCards.length > 0) {
    recommendations.push({
      type: 'exercise',
      title: `Изучить новые слова`,
      description: `Добавьте ${Math.min(10, newCards.length)} новых слов из ваших словарей.`,
      reason: 'Регулярное добавление новых слов ускоряет прогресс',
      priority: 7,
      data: { cardIds: newCards.slice(0, 10).map(c => c.id) },
    });
  }

  const sessions = langProgress.studySessions;
  if (sessions.length >= 3) {
    const recentAccuracy = sessions.slice(-3).reduce(
      (acc, s) => acc + s.correctAnswers / s.cardsStudied, 0
    ) / 3;

    if (recentAccuracy > 0.85 && langProgress.level !== 'advanced') {
      recommendations.push({
        type: 'dictionary',
        title: 'Попробуйте более сложный уровень',
        description: `Ваша точность ${Math.round(recentAccuracy * 100)}%. Вы готовы к более сложным словам!`,
        reason: 'Высокая точность в последних сессиях',
        priority: 8,
      });
    } else if (recentAccuracy < 0.6) {
      recommendations.push({
        type: 'tip',
        title: 'Снизьте темп обучения',
        description: 'Сосредоточьтесь на уже изученных словах, прежде чем добавлять новые.',
        reason: 'Точность ниже 60% в последних сессиях',
        priority: 8,
      });
    }
  }

  const totalSessions = sessions.length;
  if (totalSessions > 0) {
    const avgDuration = sessions.reduce((a, s) => a + s.duration, 0) / totalSessions;
    if (avgDuration < 10) {
      recommendations.push({
        type: 'tip',
        title: 'Увеличьте время занятий',
        description: 'Сессии менее 10 минут менее эффективны. Попробуйте заниматься 15-20 минут.',
        reason: 'Среднее время сессии менее 10 минут',
        priority: 5,
      });
    }
  }

  if (user.streak >= 7) {
    recommendations.push({
      type: 'tip',
      title: `🔥 Серия ${user.streak} дней!`,
      description: 'Отличная работа! Продолжайте заниматься каждый день для закрепления навыков.',
      reason: 'Поддержание ежедневной привычки',
      priority: 6,
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

export function getAdaptiveNextLevel(currentLevel: DifficultyLevel, accuracy: number): DifficultyLevel {
  const levels: DifficultyLevel[] = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];
  const currentIdx = levels.indexOf(currentLevel);

  if (accuracy >= 85 && currentIdx < levels.length - 1) return levels[currentIdx + 1];
  if (accuracy < 50 && currentIdx > 0) return levels[currentIdx - 1];
  return currentLevel;
}

export function generateExercises(cards: Flashcard[], allWords: Word[], count: number = 10) {
  const selected = [...cards].sort(() => Math.random() - 0.5).slice(0, count);

  return selected.map(card => {
    const exerciseType = Math.random() > 0.5 ? 'multiple-choice' : 'typing';
    if (exerciseType === 'multiple-choice') {
      const distractors = allWords
        .filter(w => w.id !== card.wordId && w.language === card.word.language)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation);
      const options = [...distractors, card.word.translation].sort(() => Math.random() - 0.5);
      return { id: card.id, type: 'multiple-choice' as const, word: card.word, options, correctAnswer: card.word.translation };
    }
    return { id: card.id, type: 'typing' as const, word: card.word, correctAnswer: card.word.translation };
  });
}

export function getSmartDailyGoal(user: User): number {
  const langProgress = user.learningLanguages[0];
  if (!langProgress) return 10;

  const sessions = langProgress.studySessions;
  if (sessions.length === 0) return 10;

  const avgCards = sessions.reduce((a, s) => a + s.cardsStudied, 0) / sessions.length;
  const recentAccuracy = sessions.slice(-3).reduce(
    (acc, s) => acc + s.correctAnswers / s.cardsStudied, 0
  ) / Math.min(3, sessions.length);

  if (recentAccuracy > 0.8) return Math.min(30, Math.round(avgCards * 1.2));
  if (recentAccuracy < 0.6) return Math.max(5, Math.round(avgCards * 0.8));
  return Math.round(avgCards);
}

export function generateAITip(language: LanguageCode): string {
  const tips: Record<string, string[]> = {
    en: [
      'Читайте английские новости каждый день — это расширяет словарный запас в контексте.',
      'Смотрите сериалы на английском с субтитрами — мозг запоминает слова через эмоции.',
      'Записывайте новые слова с примерами предложений, а не просто переводом.',
      'Практикуйте произношение вслух — даже 5 минут в день дают результат.',
      'Используйте технику «shadowing» — повторяйте за носителем языка.',
    ],
    de: [
      'Изучайте немецкие слова вместе с артиклем — это основа грамматики.',
      'Читайте детские книги на немецком для закрепления базовой лексики.',
      'Немецкие составные слова легче запомнить, если разбить их на части.',
    ],
    fr: [
      'Слушайте французские подкасты — произношение особенно важно во французском.',
      'Французские песни — отличный способ запомнить грамматические конструкции.',
    ],
    es: [
      'Испанский и русский имеют схожий звуковой состав — используйте это преимущество.',
      'Общайтесь с носителями языка через языковые обмены.',
    ],
    default: [
      'Регулярность важнее интенсивности: 15 минут каждый день лучше 3 часов раз в неделю.',
      'Связывайте новые слова с уже знакомыми понятиями для лучшего запоминания.',
      'Изучайте слова в контексте, а не изолированно.',
    ],
  };

  const langTips = tips[language] || tips['default'];
  return langTips[Math.floor(Math.random() * langTips.length)];
}
