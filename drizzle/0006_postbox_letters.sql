-- 광장 우체통 편지: 메일 설정이 없을 때만 90일 보관 (2026-11-23)
CREATE TABLE IF NOT EXISTS postbox_letters (
  id text PRIMARY KEY NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  created_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS postbox_letters_created ON postbox_letters (created_at);
