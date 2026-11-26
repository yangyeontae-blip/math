-- 광장 작은 기부함: 모든 학생이 함께 모은 베리 합계 (2026-11-26)
CREATE TABLE IF NOT EXISTS donation_box (
  id integer PRIMARY KEY NOT NULL,
  total integer NOT NULL,
  gifts integer NOT NULL,
  updated_at integer NOT NULL
);
-- 같은 기부가 두 번 더해지지 않게 요청 번호만 30일 보관(이름·기기 정보는 저장하지 않음)
CREATE TABLE IF NOT EXISTS donation_gifts (
  request_id text PRIMARY KEY NOT NULL,
  amount integer NOT NULL,
  created_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS donation_gifts_created ON donation_gifts (created_at);
