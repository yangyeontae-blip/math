import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 우리 반 협동 보스: 반 코드·주차·기기별 피해량. 이름 같은 개인정보는 저장하지 않아요.
export const bossProgress = sqliteTable('boss_progress', {
  classCode: text('class_code').notNull(),
  week: text('week').notNull(),
  playerId: text('player_id').notNull(),
  damage: integer('damage').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  primaryKey({ columns: [table.classCode, table.week, table.playerId] }),
  index('idx_boss_progress_class_week').on(table.classCode, table.week),
]);

export const expeditionRankings = sqliteTable('expedition_rankings', {
  playerId: text('player_id').primaryKey(),
  nickname: text('nickname').notNull(),
  completed: integer('completed').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  index('idx_expedition_rankings_completed').on(table.completed),
]);

// Ephemeral, hashed-IP rate buckets only. Feedback text goes directly to email.
export const feedbackLimits = sqliteTable('feedback_limits', {
  key: text('key').primaryKey().notNull(),
  bucket: integer('bucket').notNull(),
  hits: integer('hits').notNull().default(1),
});

// Optional accounts. No email, real name, school or plaintext credentials.
export const adventureAccounts = sqliteTable('adventure_accounts', {
 username: text('username').primaryKey(), passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(),
 recoveryHash: text('recovery_hash').notNull(), snapshot: text('snapshot'), previousSnapshot: text('previous_snapshot'),
 revision: integer('revision').notNull().default(0), updatedAt: integer('updated_at').notNull(),
});
export const adventureSessions = sqliteTable('adventure_sessions', {
 tokenHash: text('token_hash').primaryKey(), username: text('username').notNull(), expiresAt: integer('expires_at').notNull(), credentialVersion: text('credential_version').notNull().default(''),
}, table => [index('idx_adventure_session_expiry').on(table.expiresAt),index('idx_adventure_session_user').on(table.username)]);
export const accountLimits = sqliteTable('account_limits', {
 key: text('key').primaryKey(), bucket: integer('bucket').notNull(), hits: integer('hits').notNull().default(1),
}, table => [index('idx_account_limit_bucket').on(table.bucket)]);
