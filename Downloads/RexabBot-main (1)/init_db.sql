-- Инициализация БД для бота клиники
-- База: Clinicapro
-- Запуск: psql -U postgres -d Clinicapro -f init_db.sql

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    source_code VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица источников (QR/ссылки)
CREATE TABLE IF NOT EXISTS sources (
    code VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scenario VARCHAR(100) NOT NULL,
    topic VARCHAR(100),
    description TEXT,
    source_code VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'new'
);

-- Таблица состояний handoff (бот остановлен для пользователя)
CREATE TABLE IF NOT EXISTS handoff_state (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    is_handoff BOOLEAN DEFAULT FALSE,
    handoff_at TIMESTAMP,
    cleared_at TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handoff_state_is_handoff ON handoff_state(is_handoff);
CREATE INDEX IF NOT EXISTS idx_users_source_code ON users(source_code);
CREATE INDEX IF NOT EXISTS idx_requests_source_code ON requests(source_code);

-- Комментарии
COMMENT ON TABLE users IS 'Пользователи бота';
COMMENT ON TABLE sources IS 'Источники/кампании для QR и ссылок';
COMMENT ON TABLE requests IS 'Заявки от пользователей (Вызвать доктора / Записаться / Вопрос админу)';
COMMENT ON TABLE handoff_state IS 'Состояние передачи пользователя админу (бот не мешает)';
