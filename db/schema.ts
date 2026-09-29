import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const expeditionRankings = sqliteTable('expedition_rankings', {
  playerId: text('player_id').primaryKey(),
  nickname: text('nickname').notNull(),
  completed: integer('completed').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  index('idx_expedition_rankings_completed').on(table.completed),
]);
