-- ============================================================
--  ЛингваИИ — Полная схема базы данных PostgreSQL
--  База: InostranDB1 | Порт: 5432 | Пользователь: postgres | Пароль: 1
-- ============================================================

-- Подключиться к нужной базе перед выполнением:
-- \c InostranDB1

-- ============================================================
--  РАСШИРЕНИЯ
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  ТИПЫ (ENUM)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('guest', 'user', 'manager', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE card_status AS ENUM ('new', 'learning', 'review', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lang_level AS ENUM ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
--  ТАБЛИЦА: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'user',
  avatar        TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  total_xp      INTEGER     NOT NULL DEFAULT 0,
  streak        INTEGER     NOT NULL DEFAULT 0,
  last_study_date DATE,
  native_language VARCHAR(10) DEFAULT 'ru',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
--  ТАБЛИЦА: learning_languages (языки, которые изучает пользователь)
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_languages (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language      VARCHAR(10) NOT NULL,
  level         lang_level  NOT NULL DEFAULT 'beginner',
  xp            INTEGER     NOT NULL DEFAULT 0,
  words_learned INTEGER     NOT NULL DEFAULT 0,
  accuracy      NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_ll_user ON learning_languages(user_id);

-- ============================================================
--  ТАБЛИЦА: study_sessions (сессии занятий)
-- ============================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_id     UUID        REFERENCES learning_languages(id) ON DELETE SET NULL,
  language        VARCHAR(10) NOT NULL,
  session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  cards_studied   INTEGER     NOT NULL DEFAULT 0,
  correct_answers INTEGER     NOT NULL DEFAULT 0,
  duration_sec    INTEGER     NOT NULL DEFAULT 0,
  xp_earned       INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_user     ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ss_date     ON study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_ss_language ON study_sessions(language);

-- ============================================================
--  ТАБЛИЦА: dictionaries (словари пользователя)
-- ============================================================
CREATE TABLE IF NOT EXISTS dictionaries (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  language        VARCHAR(10) NOT NULL,
  native_language VARCHAR(10) NOT NULL DEFAULT 'ru',
  level           lang_level  DEFAULT 'beginner',
  is_public       BOOLEAN     NOT NULL DEFAULT FALSE,
  cover_color     VARCHAR(20) DEFAULT '#6366f1',
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dicts_user     ON dictionaries(user_id);
CREATE INDEX IF NOT EXISTS idx_dicts_language ON dictionaries(language);
CREATE INDEX IF NOT EXISTS idx_dicts_public   ON dictionaries(is_public) WHERE is_public = TRUE;

-- ============================================================
--  ТАБЛИЦА: words (слова в словарях)
-- ============================================================
CREATE TABLE IF NOT EXISTS words (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dictionary_id   UUID        NOT NULL REFERENCES dictionaries(id) ON DELETE CASCADE,
  term            VARCHAR(255) NOT NULL,
  translation     VARCHAR(255) NOT NULL,
  language        VARCHAR(10) NOT NULL,
  native_language VARCHAR(10) NOT NULL DEFAULT 'ru',
  phonetic        VARCHAR(255),
  part_of_speech  VARCHAR(50),
  examples        JSONB       DEFAULT '[]',
  tags            TEXT[],
  difficulty      lang_level  DEFAULT 'beginner',
  audio_url       TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_words_dict     ON words(dictionary_id);
CREATE INDEX IF NOT EXISTS idx_words_language ON words(language);
CREATE INDEX IF NOT EXISTS idx_words_term     ON words USING gin(to_tsvector('simple', term));

-- ============================================================
--  ТАБЛИЦА: flashcards (карточки SM-2)
-- ============================================================
CREATE TABLE IF NOT EXISTS flashcards (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id           UUID        NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            card_status NOT NULL DEFAULT 'new',
  interval_days     INTEGER     NOT NULL DEFAULT 1,
  ease_factor       NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  repetitions       INTEGER     NOT NULL DEFAULT 0,
  next_review_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  correct_count     INTEGER     NOT NULL DEFAULT 0,
  incorrect_count   INTEGER     NOT NULL DEFAULT 0,
  last_reviewed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(word_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fc_user        ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_review_date ON flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_fc_status      ON flashcards(status);

-- ============================================================
--  ТАБЛИЦА: achievements (все возможные достижения)
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT        NOT NULL,
  icon        VARCHAR(10),
  category    VARCHAR(50),
  xp_reward   INTEGER     NOT NULL DEFAULT 0,
  condition   JSONB       DEFAULT '{}'
);

-- ============================================================
--  ТАБЛИЦА: user_achievements (выданные достижения)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements(user_id);

-- ============================================================
--  ТАБЛИЦА: ai_chat_messages (история чата с ИИ)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       message_role NOT NULL,
  content    TEXT         NOT NULL,
  language   VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_date ON ai_chat_messages(created_at);

-- ============================================================
--  ТАБЛИЦА: user_settings (настройки пользователя)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id           UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme             VARCHAR(10) DEFAULT 'light',
  current_language  VARCHAR(10) DEFAULT 'en',
  daily_goal        INTEGER DEFAULT 20,
  notifications     BOOLEAN DEFAULT TRUE,
  sound_enabled     BOOLEAN DEFAULT TRUE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  ТАБЛИЦА: game_scores (результаты игр)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type   VARCHAR(50) NOT NULL,
  score       INTEGER     NOT NULL DEFAULT 0,
  xp_earned   INTEGER     NOT NULL DEFAULT 0,
  language    VARCHAR(10),
  duration_sec INTEGER,
  played_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gs_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_gs_game ON game_scores(game_type);

-- ============================================================
--  ФУНКЦИЯ: автообновление updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_dicts_updated_at
  BEFORE UPDATE ON dictionaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
--  ФУНКЦИЯ: начисление XP пользователю
-- ============================================================
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_xp INTEGER, p_language VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET total_xp = total_xp + p_xp WHERE id = p_user_id;
  UPDATE learning_languages SET xp = xp + p_xp
    WHERE user_id = p_user_id AND language = p_language;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  ФУНКЦИЯ: обновление streak при входе
-- ============================================================
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_study_date INTO v_last_date FROM users WHERE id = p_user_id;
  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    UPDATE users SET streak = 1, last_study_date = v_today WHERE id = p_user_id;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    UPDATE users SET streak = streak + 1, last_study_date = v_today WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  ФУНКЦИЯ: SM-2 алгоритм (расчёт следующего повторения)
-- ============================================================
CREATE OR REPLACE FUNCTION sm2_update(
  p_flashcard_id UUID,
  p_quality      INTEGER  -- 0=забыл, 1=трудно, 2=хорошо, 3=легко
)
RETURNS VOID AS $$
DECLARE
  v_ef      NUMERIC(4,2);
  v_rep     INTEGER;
  v_int     INTEGER;
  v_new_ef  NUMERIC(4,2);
  v_new_int INTEGER;
  v_status  card_status;
BEGIN
  SELECT ease_factor, repetitions, interval_days
    INTO v_ef, v_rep, v_int
    FROM flashcards WHERE id = p_flashcard_id;

  -- Пересчёт ease factor
  v_new_ef := GREATEST(1.3, v_ef + 0.1 - (3 - p_quality) * (0.08 + (3 - p_quality) * 0.02));

  IF p_quality < 2 THEN
    -- Неправильный ответ — сброс
    v_new_int := 1;
    v_rep     := 0;
    v_status  := 'learning';
  ELSE
    -- Правильный ответ
    v_rep := v_rep + 1;
    IF v_rep = 1 THEN
      v_new_int := 1;
    ELSIF v_rep = 2 THEN
      v_new_int := 6;
    ELSE
      v_new_int := ROUND(v_int * v_new_ef);
    END IF;
    v_status := CASE WHEN v_new_int >= 21 THEN 'mastered'
                     WHEN v_new_int >= 7  THEN 'review'
                     ELSE 'learning' END;
  END IF;

  UPDATE flashcards SET
    ease_factor       = v_new_ef,
    repetitions       = v_rep,
    interval_days     = v_new_int,
    next_review_date  = CURRENT_DATE + v_new_int,
    status            = v_status,
    last_reviewed_at  = NOW(),
    correct_count     = correct_count + CASE WHEN p_quality >= 2 THEN 1 ELSE 0 END,
    incorrect_count   = incorrect_count + CASE WHEN p_quality < 2 THEN 1 ELSE 0 END
  WHERE id = p_flashcard_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================================

-- Лидерборд
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.avatar,
  u.total_xp,
  u.streak,
  u.role,
  RANK() OVER (ORDER BY u.total_xp DESC) AS rank_all,
  RANK() OVER (ORDER BY u.streak DESC)   AS rank_streak
FROM users u
WHERE u.is_active = TRUE AND u.role != 'guest'
ORDER BY u.total_xp DESC;

-- Статистика по пользователям для админа
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.is_active,
  u.total_xp,
  u.streak,
  u.created_at,
  u.last_login,
  COUNT(DISTINCT d.id)  AS dict_count,
  COUNT(DISTINCT f.id)  AS flashcard_count,
  COUNT(DISTINCT ss.id) AS session_count
FROM users u
LEFT JOIN dictionaries d  ON d.user_id = u.id
LEFT JOIN flashcards   f  ON f.user_id = u.id
LEFT JOIN study_sessions ss ON ss.user_id = u.id
GROUP BY u.id;

-- Карточки к повторению сегодня
CREATE OR REPLACE VIEW due_flashcards AS
SELECT
  f.*,
  w.term,
  w.translation,
  w.language,
  w.phonetic,
  w.examples,
  d.name AS dictionary_name
FROM flashcards f
JOIN words       w ON w.id = f.word_id
JOIN dictionaries d ON d.id = w.dictionary_id
WHERE f.next_review_date <= CURRENT_DATE;

-- ============================================================
--  НАЧАЛЬНЫЕ ДАННЫЕ
-- ============================================================

-- Тестовые пользователи (пароли хешированы через pgcrypto crypt)
INSERT INTO users (id, email, name, password_hash, role, total_xp, streak)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@linguaai.ru',
   'Администратор',
   crypt('admin123', gen_salt('bf')),
   'admin', 15200, 45),

  ('00000000-0000-0000-0000-000000000002',
   'manager@linguaai.ru',
   'Менеджер',
   crypt('manager123', gen_salt('bf')),
   'manager', 7800, 12),

  ('00000000-0000-0000-0000-000000000003',
   'user@linguaai.ru',
   'Александр',
   crypt('user123', gen_salt('bf')),
   'user', 3400, 7)
ON CONFLICT (email) DO NOTHING;

-- Настройки по умолчанию для тестовых пользователей
INSERT INTO user_settings (user_id, theme, current_language)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'dark', 'en'),
  ('00000000-0000-0000-0000-000000000002', 'light', 'en'),
  ('00000000-0000-0000-0000-000000000003', 'light', 'en')
ON CONFLICT (user_id) DO NOTHING;

-- Языки обучения для тестового пользователя
INSERT INTO learning_languages (user_id, language, level, xp, words_learned, accuracy)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'en', 'elementary', 3400, 120, 78.5)
ON CONFLICT (user_id, language) DO NOTHING;

-- Достижения
INSERT INTO achievements (code, name, description, icon, category, xp_reward, condition) VALUES
  ('first_word',      'Первое слово',       'Добавьте первое слово в словарь',            '🎯', 'study',   50,  '{"words_added": 1}'),
  ('ten_words',       '10 слов',            'Добавьте 10 слов в словарь',                 '📚', 'study',   100, '{"words_added": 10}'),
  ('hundred_words',   '100 слов',           'Добавьте 100 слов в словарь',                '🏆', 'study',   500, '{"words_added": 100}'),
  ('first_session',   'Первое занятие',     'Завершите первую сессию изучения',            '⚡', 'study',   100, '{"sessions": 1}'),
  ('streak_3',        '3 дня подряд',       'Занимайтесь 3 дня подряд',                   '🔥', 'streak',  150, '{"streak": 3}'),
  ('streak_7',        'Неделя',             'Занимайтесь 7 дней подряд',                  '🔥', 'streak',  300, '{"streak": 7}'),
  ('streak_30',       'Месяц',              'Занимайтесь 30 дней подряд',                 '🏅', 'streak', 1000, '{"streak": 30}'),
  ('first_mastered',  'Мастер слова',       'Переведите карточку в статус "усвоено"',     '⭐', 'cards',   200, '{"mastered": 1}'),
  ('ten_mastered',    '10 усвоено',         'Переведите 10 карточек в статус "усвоено"',  '🌟', 'cards',   500, '{"mastered": 10}'),
  ('game_first',      'Первая игра',        'Сыграйте в любую игру',                      '🎮', 'games',   100, '{"games_played": 1}'),
  ('game_winner',     'Победитель',         'Наберите 1000 очков в Speed Round',          '🥇', 'games',   300, '{"speed_score": 1000}'),
  ('xp_1000',         '1000 XP',            'Наберите 1000 XP',                           '✨', 'xp',      200, '{"total_xp": 1000}'),
  ('xp_10000',        '10 000 XP',          'Наберите 10 000 XP',                         '💎', 'xp',     1000, '{"total_xp": 10000}')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
--  ФУНКЦИЯ: проверка пароля при входе
-- ============================================================
CREATE OR REPLACE FUNCTION verify_login(p_email TEXT, p_password TEXT)
RETURNS TABLE(
  id          UUID,
  email       TEXT,
  name        TEXT,
  role        user_role,
  is_active   BOOLEAN,
  total_xp    INTEGER,
  streak      INTEGER,
  avatar      TEXT,
  created_at  TIMESTAMPTZ,
  last_login  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.email::TEXT, u.name::TEXT, u.role,
    u.is_active, u.total_xp, u.streak,
    u.avatar::TEXT, u.created_at, u.last_login
  FROM users u
  WHERE u.email = lower(p_email)
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = TRUE;

  -- Обновляем время последнего входа если нашли пользователя
  UPDATE users SET last_login = NOW()
    WHERE email = lower(p_email)
      AND password_hash = crypt(p_password, password_hash);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  ФУНКЦИЯ: регистрация нового пользователя
-- ============================================================
CREATE OR REPLACE FUNCTION register_user(
  p_name     TEXT,
  p_email    TEXT,
  p_password TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO users (name, email, password_hash, role)
  VALUES (p_name, lower(p_email), crypt(p_password, gen_salt('bf')), 'user')
  RETURNING id INTO v_id;

  -- Создаём настройки по умолчанию
  INSERT INTO user_settings (user_id) VALUES (v_id);

  -- Добавляем английский язык по умолчанию
  INSERT INTO learning_languages (user_id, language) VALUES (v_id, 'en');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  ПРАВА ДОСТУПА (GRANT)
-- ============================================================
-- Если используете отдельного пользователя приложения:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO linguaai_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO linguaai_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO linguaai_app;

-- ============================================================
--  ТИПЫ ДЛЯ КУРСОВ
-- ============================================================
DO $$ BEGIN
  CREATE TYPE course_tier AS ENUM ('standard', 'medium', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE purchase_status AS ENUM ('pending', 'confirmed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lesson_type AS ENUM ('video', 'practice', 'test', 'speaking');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
--  ТАБЛИЦА: courses (курсы)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(300)  NOT NULL,
  description    TEXT,
  language       VARCHAR(10)   NOT NULL,
  level          lang_level    NOT NULL DEFAULT 'beginner',
  tier           course_tier   NOT NULL DEFAULT 'standard',
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         course_status NOT NULL DEFAULT 'draft',
  cover_color    VARCHAR(20)   DEFAULT '#6366f1',
  emoji          VARCHAR(10),
  features       TEXT[]        DEFAULT '{}',
  rating         NUMERIC(3,2)  DEFAULT 0.00,
  total_students INTEGER       DEFAULT 0,
  created_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_status   ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_tier     ON courses(tier);

CREATE OR REPLACE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
--  ТАБЛИЦА: course_lessons (уроки курсов)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(300) NOT NULL,
  lesson_type  lesson_type NOT NULL DEFAULT 'video',
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  duration_min INTEGER     DEFAULT 0,
  content_url  TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id);

-- ============================================================
--  ТАБЛИЦА: purchases (покупки курсов)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id      UUID            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tier           course_tier     NOT NULL,
  amount         NUMERIC(10,2)   NOT NULL,
  status         purchase_status NOT NULL DEFAULT 'confirmed',
  payer_name     VARCHAR(200),
  payer_email    VARCHAR(255),
  card_last_four VARCHAR(4),
  confirmed_by   UUID            REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user   ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course ON purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- ============================================================
--  ТАБЛИЦА: lesson_progress (прогресс по урокам)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    UUID        NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  score        NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_user ON lesson_progress(user_id);

-- ============================================================
--  ТАБЛИЦА: course_reviews (отзывы о курсах)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_reviews (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);

-- ============================================================
--  ТАБЛИЦА: tests (тесты)
-- ============================================================
CREATE TABLE IF NOT EXISTS tests (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  language       VARCHAR(10) NOT NULL,
  level          lang_level  NOT NULL DEFAULT 'beginner',
  passing_score  INTEGER     NOT NULL DEFAULT 70,
  time_limit_min INTEGER,
  is_public      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question       TEXT        NOT NULL,
  question_type  VARCHAR(50) NOT NULL DEFAULT 'multiple-choice',
  options        TEXT[]      DEFAULT '{}',
  correct_answer TEXT        NOT NULL,
  sort_order     INTEGER     DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_results (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score          NUMERIC(5,2) NOT NULL,
  passed         BOOLEAN     NOT NULL,
  time_spent_sec INTEGER,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);

-- ============================================================
--  ТАБЛИЦА: notifications (уведомления)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(300) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);

-- ============================================================
--  ПРЕДСТАВЛЕНИЕ: статистика курсов для менеджера
-- ============================================================
CREATE OR REPLACE VIEW manager_course_stats AS
SELECT
  c.id,
  c.title,
  c.language,
  c.tier,
  c.status,
  c.price,
  c.rating,
  c.total_students,
  u.name AS author_name,
  COUNT(DISTINCT p.id)  AS purchase_count,
  SUM(p.amount)         AS revenue,
  COUNT(DISTINCT r.id)  AS review_count,
  AVG(r.rating)         AS avg_rating
FROM courses c
LEFT JOIN users    u ON u.id = c.created_by
LEFT JOIN purchases p ON p.course_id = c.id AND p.status = 'confirmed'
LEFT JOIN course_reviews r ON r.course_id = c.id
GROUP BY c.id, u.name;

-- ============================================================
--  ПРОВЕРКА (ТЕСТ)
-- ============================================================
-- SELECT * FROM verify_login('admin@linguaai.ru', 'admin123');
-- SELECT * FROM leaderboard;
-- SELECT * FROM admin_user_stats;
-- SELECT * FROM manager_course_stats;














