import { Word, Dictionary, User, Flashcard, LanguageCode } from '../types';

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'Английский',
  fr: 'Французский',
  zh: 'Китайский',
};

export const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  zh: '🇨🇳',
};

const wordsEn: Word[] = [
  { id: 'en1',  term: 'hello',        translation: 'привет',              language: 'en', nativeLanguage: 'en', phonetic: '/həˈloʊ/',       partOfSpeech: 'interjection', examples: ['Hello! How are you?'],               tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'en2',  term: 'thank you',    translation: 'спасибо',             language: 'en', nativeLanguage: 'en', phonetic: '/θæŋk juː/',     partOfSpeech: 'phrase',       examples: ['Thank you very much!'],            tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'en3',  term: 'please',       translation: 'пожалуйста',          language: 'en', nativeLanguage: 'en', phonetic: '/pliːz/',         partOfSpeech: 'adverb',       examples: ['Can you help me, please?'],        tags: ['basic'],     difficulty: 'beginner', frequency: 99 },
  { id: 'en4',  term: 'yes',          translation: 'да',                  language: 'en', nativeLanguage: 'en', phonetic: '/jɛs/',           partOfSpeech: 'adverb',       examples: ['Yes, I understand.'],              tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'en5',  term: 'no',           translation: 'нет',                 language: 'en', nativeLanguage: 'en', phonetic: '/noʊ/',           partOfSpeech: 'adverb',       examples: ['No, thank you.'],                  tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'en6',  term: 'good morning', translation: 'доброе утро',         language: 'en', nativeLanguage: 'en', phonetic: '/ɡʊd ˈmɔːrnɪŋ/', partOfSpeech: 'phrase',       examples: ['Good morning! Did you sleep well?'], tags: ['greetings'], difficulty: 'beginner', frequency: 95 },
  { id: 'en7',  term: 'water',        translation: 'вода',                language: 'en', nativeLanguage: 'en', phonetic: '/ˈwɔːtər/',       partOfSpeech: 'noun',         examples: ['I need some water.'],              tags: ['everyday'],  difficulty: 'beginner', frequency: 97 },
  { id: 'en8',  term: 'food',         translation: 'еда',                 language: 'en', nativeLanguage: 'en', phonetic: '/fuːd/',           partOfSpeech: 'noun',         examples: ['The food is delicious.'],          tags: ['everyday'],  difficulty: 'beginner', frequency: 96 },
  { id: 'en9',  term: 'house',        translation: 'дом',                 language: 'en', nativeLanguage: 'en', phonetic: '/haʊs/',           partOfSpeech: 'noun',         examples: ['This is my house.'],               tags: ['everyday'],  difficulty: 'beginner', frequency: 95 },
  { id: 'en10', term: 'friend',       translation: 'друг',                language: 'en', nativeLanguage: 'en', phonetic: '/frɛnd/',          partOfSpeech: 'noun',         examples: ['She is my best friend.'],          tags: ['people'],    difficulty: 'beginner', frequency: 94 },
  { id: 'en11', term: 'work',         translation: 'работа / работать',   language: 'en', nativeLanguage: 'en', phonetic: '/wɜːrk/',          partOfSpeech: 'noun/verb',    examples: ['I go to work every day.'],         tags: ['everyday'],  difficulty: 'beginner', frequency: 96 },
  { id: 'en12', term: 'day',          translation: 'день',                language: 'en', nativeLanguage: 'en', phonetic: '/deɪ/',            partOfSpeech: 'noun',         examples: ['Have a nice day!'],                tags: ['time'],      difficulty: 'beginner', frequency: 97 },
  { id: 'en13', term: 'good night',   translation: 'спокойной ночи',      language: 'en', nativeLanguage: 'en', phonetic: '/ɡʊd naɪt/',      partOfSpeech: 'phrase',       examples: ['Good night, sleep well!'],         tags: ['greetings'], difficulty: 'beginner', frequency: 92 },
  { id: 'en14', term: 'sorry',        translation: 'извини / простите',   language: 'en', nativeLanguage: 'en', phonetic: '/ˈsɒri/',          partOfSpeech: 'interjection', examples: ['Sorry, I am late.'],               tags: ['basic'],     difficulty: 'beginner', frequency: 93 },
  { id: 'en15', term: 'help',         translation: 'помощь / помогать',   language: 'en', nativeLanguage: 'en', phonetic: '/hɛlp/',           partOfSpeech: 'noun/verb',    examples: ['Can you help me?'],                tags: ['basic'],     difficulty: 'beginner', frequency: 94 },
  { id: 'en16', term: 'time',         translation: 'время',               language: 'en', nativeLanguage: 'en', phonetic: '/taɪm/',           partOfSpeech: 'noun',         examples: ['What time is it?'],                tags: ['time'],      difficulty: 'beginner', frequency: 98 },
  { id: 'en17', term: 'money',        translation: 'деньги',              language: 'en', nativeLanguage: 'en', phonetic: '/ˈmʌni/',          partOfSpeech: 'noun',         examples: ['I have no money.'],                tags: ['everyday'],  difficulty: 'beginner', frequency: 93 },
  { id: 'en18', term: 'love',         translation: 'любовь / любить',     language: 'en', nativeLanguage: 'en', phonetic: '/lʌv/',            partOfSpeech: 'noun/verb',    examples: ['I love you.'],                     tags: ['feelings'],  difficulty: 'beginner', frequency: 97 },
  { id: 'en19', term: 'family',       translation: 'семья',               language: 'en', nativeLanguage: 'en', phonetic: '/ˈfæmɪli/',        partOfSpeech: 'noun',         examples: ['My family is big.'],               tags: ['people'],    difficulty: 'beginner', frequency: 92 },
  { id: 'en20', term: 'school',       translation: 'школа',               language: 'en', nativeLanguage: 'en', phonetic: '/skuːl/',          partOfSpeech: 'noun',         examples: ['I go to school every day.'],       tags: ['education'], difficulty: 'beginner', frequency: 91 },
  { id: 'en21', term: 'name',         translation: 'имя',                 language: 'en', nativeLanguage: 'en', phonetic: '/neɪm/',           partOfSpeech: 'noun',         examples: ['My name is Anna.'],                tags: ['people'],    difficulty: 'beginner', frequency: 95 },
  { id: 'en22', term: 'city',         translation: 'город',               language: 'en', nativeLanguage: 'en', phonetic: '/ˈsɪti/',          partOfSpeech: 'noun',         examples: ['I live in a big city.'],           tags: ['places'],    difficulty: 'beginner', frequency: 90 },
  { id: 'en23', term: 'eat',          translation: 'есть / кушать',       language: 'en', nativeLanguage: 'en', phonetic: '/iːt/',            partOfSpeech: 'verb',         examples: ['I eat breakfast every morning.'],  tags: ['everyday'],  difficulty: 'beginner', frequency: 96 },
  { id: 'en24', term: 'drink',        translation: 'пить',                language: 'en', nativeLanguage: 'en', phonetic: '/drɪŋk/',          partOfSpeech: 'verb',         examples: ['I drink coffee in the morning.'],  tags: ['everyday'],  difficulty: 'beginner', frequency: 94 },
  { id: 'en25', term: 'read',         translation: 'читать',              language: 'en', nativeLanguage: 'en', phonetic: '/riːd/',           partOfSpeech: 'verb',         examples: ['I like to read books.'],           tags: ['education'], difficulty: 'beginner', frequency: 93 },
];

const wordsFr: Word[] = [
  { id: 'fr1',  term: 'bonjour',         translation: 'здравствуйте',    language: 'fr', nativeLanguage: 'fr', phonetic: '/bɔ̃ʒuʁ/',    partOfSpeech: 'interjection', examples: ['Bonjour! Comment allez-vous?'], tags: ['greetings'], difficulty: 'beginner', frequency: 100 },
  { id: 'fr2',  term: 'merci',           translation: 'спасибо',         language: 'fr', nativeLanguage: 'fr', phonetic: '/mɛʁsi/',      partOfSpeech: 'interjection', examples: ['Merci beaucoup!'],              tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'fr3',  term: 'oui',             translation: 'да',              language: 'fr', nativeLanguage: 'fr', phonetic: '/wi/',          partOfSpeech: 'adverb',       examples: ['Oui, je comprends.'],           tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'fr4',  term: 'non',             translation: 'нет',             language: 'fr', nativeLanguage: 'fr', phonetic: '/nɔ̃/',         partOfSpeech: 'adverb',       examples: ['Non, merci.'],                  tags: ['basic'],     difficulty: 'beginner', frequency: 100 },
  { id: 'fr5',  term: "l'eau",           translation: 'вода',            language: 'fr', nativeLanguage: 'fr', phonetic: '/lo/',          partOfSpeech: 'noun',         examples: ["J'ai besoin d'eau."],           tags: ['everyday'],  difficulty: 'beginner', frequency: 96 },
  { id: 'fr6',  term: 'la maison',       translation: 'дом',             language: 'fr', nativeLanguage: 'fr', phonetic: '/la mɛzɔ̃/',   partOfSpeech: 'noun',         examples: ['Ma maison est grande.'],        tags: ['everyday'],  difficulty: 'beginner', frequency: 94 },
  { id: 'fr7',  term: "s'il vous plaît", translation: 'пожалуйста',      language: 'fr', nativeLanguage: 'fr', phonetic: '/sil vu plɛ/', partOfSpeech: 'phrase',       examples: ["L'addition, s'il vous plaît."], tags: ['basic'],    difficulty: 'beginner', frequency: 98 },
  { id: 'fr8',  term: 'au revoir',       translation: 'до свидания',     language: 'fr', nativeLanguage: 'fr', phonetic: '/o ʁəvwaʁ/',  partOfSpeech: 'phrase',       examples: ['Au revoir, à bientôt!'],        tags: ['greetings'], difficulty: 'beginner', frequency: 97 },
  { id: 'fr9',  term: "je m'appelle",    translation: 'меня зовут',      language: 'fr', nativeLanguage: 'fr', phonetic: '/ʒə mapɛl/',   partOfSpeech: 'phrase',       examples: ["Je m'appelle Marie."],          tags: ['people'],    difficulty: 'beginner', frequency: 92 },
  { id: 'fr10', term: 'le pain',         translation: 'хлеб',            language: 'fr', nativeLanguage: 'fr', phonetic: '/lə pɛ̃/',      partOfSpeech: 'noun',         examples: ['Le pain est frais.'],           tags: ['food'],      difficulty: 'beginner', frequency: 89 },
  { id: 'fr11', term: "j'aime",          translation: 'я люблю',         language: 'fr', nativeLanguage: 'fr', phonetic: '/ʒɛm/',         partOfSpeech: 'phrase',       examples: ["J'aime le chocolat."],          tags: ['feelings'],  difficulty: 'beginner', frequency: 91 },
  { id: 'fr12', term: 'la famille',      translation: 'семья',           language: 'fr', nativeLanguage: 'fr', phonetic: '/la famij/',    partOfSpeech: 'noun',         examples: ['Ma famille est importante.'],   tags: ['people'],    difficulty: 'beginner', frequency: 90 },
  { id: 'fr13', term: 'bonne nuit',      translation: 'спокойной ночи',  language: 'fr', nativeLanguage: 'fr', phonetic: '/bɔn nɥi/',    partOfSpeech: 'phrase',       examples: ['Bonne nuit, dors bien!'],       tags: ['greetings'], difficulty: 'beginner', frequency: 88 },
  { id: 'fr14', term: 'excusez-moi',     translation: 'извините',        language: 'fr', nativeLanguage: 'fr', phonetic: '/ɛkskyzɛ mwa/', partOfSpeech: 'phrase',      examples: ['Excusez-moi, où est la gare?'], tags: ['basic'],    difficulty: 'beginner', frequency: 87 },
  { id: 'fr15', term: 'le café',         translation: 'кофе / кафе',     language: 'fr', nativeLanguage: 'fr', phonetic: '/lə kafe/',     partOfSpeech: 'noun',         examples: ['Un café, s\'il vous plaît.'],   tags: ['food'],      difficulty: 'beginner', frequency: 86 },
];

export const sampleDictionaries: Dictionary[] = [
  {
    id: 'dict-en-a1',
    name: 'Английский — базовые слова',
    description: 'Самые нужные слова для старта: приветствия, бытовая лексика, уровень A1',
    language: 'en',
    nativeLanguage: 'en',
    level: 'beginner',
    words: wordsEn,
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01',
    tags: ['beginner', 'a1', 'basic'],
    coverColor: '#4a6cf7',
  },
  {
    id: 'dict-fr-a1',
    name: 'Французский — базовые слова',
    description: 'Первые слова французского языка: приветствия и повседневная лексика A1',
    language: 'fr',
    nativeLanguage: 'fr',
    level: 'beginner',
    words: wordsFr,
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01',
    tags: ['beginner', 'a1', 'basic'],
    coverColor: '#10b981',
  },
];

export const defaultUser: User = {
  id: 'user1',
  name: 'Пользователь',
  nativeLanguage: 'en',
  learningLanguages: [
    {
      language: 'en',
      level: 'beginner',
      xp: 0,
      wordsLearned: 0,
      accuracy: 0,
      studySessions: [],
    },
  ],
  totalXP: 0,
  streak: 0,
  lastStudyDate: new Date().toISOString().split('T')[0],
  joinedAt: new Date().toISOString().split('T')[0],
  dailyGoal: 20,
  notificationsEnabled: true,
};

export const generateFlashcardsFromDictionary = (dict: Dictionary): Flashcard[] => {
  return dict.words.map((word, index) => ({
    id: `fc-${dict.id}-${word.id}`,
    wordId: word.id,
    word,
    status: index < 3 ? 'mastered' : index < 6 ? 'review' : index < 9 ? 'learning' : 'new',
    nextReviewDate: new Date(Date.now() + index * 86400000).toISOString(),
    reviewCount: index < 3 ? 5 : index < 6 ? 3 : index < 9 ? 1 : 0,
    correctCount: index < 3 ? 4 : index < 6 ? 2 : index < 9 ? 1 : 0,
    incorrectCount: index < 3 ? 1 : index < 6 ? 1 : 0,
    easeFactor: 2.5,
    interval: index < 3 ? 21 : index < 6 ? 7 : 1,
    addedAt: new Date(Date.now() - index * 86400000).toISOString(),
  }));
};
