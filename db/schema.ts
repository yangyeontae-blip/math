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
