-- Migration: add sources tracking

ALTER TABLE users ADD COLUMN IF NOT EXISTS source_code VARCHAR(64);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS source_code VARCHAR(64);

CREATE TABLE IF NOT EXISTS sources (
    code VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_source_code ON users(source_code);
CREATE INDEX IF NOT EXISTS idx_requests_source_code ON requests(source_code);

COMMENT ON TABLE sources IS 'Источники/кампании для QR и ссылок';
