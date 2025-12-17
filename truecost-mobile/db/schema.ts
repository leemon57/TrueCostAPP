import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// This replaces your 'model LoanScenario' in Prisma
export const loanScenarios = sqliteTable('loan_scenarios', {
  id: text('id').primaryKey(), // You can use a library to generate CUIDs or UUIDs
  name: text('name').notNull(),
  principal: real('principal').notNull(), // 'Decimal' in Prisma becomes 'real' or 'integer' in SQLite
  currency: text('currency').default('CAD'),
  termMonths: integer('term_months').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});