import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper to generate IDs (since we don't have Prisma's @default(cuid()))
// You can install 'expo-crypto' for randomUUID if you prefer
const generateId = () => Math.random().toString(36).substring(2, 15);

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(generateId),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(generateId),
  amount: real('amount').notNull(), // 'Decimal' becomes 'real'
  description: text('description').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey().$defaultFn(generateId),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  month: integer('month').notNull(), // Storing as integer (1-12) or string "YYYY-MM"
  year: integer('year').notNull(),
  userId: text('user_id').references(() => users.id),
});

export const loanScenarios = sqliteTable('loan_scenarios', {
  id: text('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull(),
  principal: real('principal').notNull(),
  rate: real('rate').notNull(),
  termMonths: integer('term_months').notNull(),
  payment: real('payment').notNull(),
  totalInterest: real('total_interest').notNull(),
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});