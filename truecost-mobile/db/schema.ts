import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Users ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(generateId),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

// --- Budget Profile ---
export const budgetProfiles = sqliteTable('budget_profiles', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').references(() => users.id),
  monthlyIncome: real('monthly_income').notNull(),
  fixedExpenses: real('fixed_expenses').notNull(),
  variableExpenses: real('variable_expenses').notNull(),
  savingsPerMonthTarget: real('savings_per_month_target'),
  emergencyFund: real('emergency_fund').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

// --- Expenses ---
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(generateId),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Loan Scenarios ---
export const loanScenarios = sqliteTable('loan_scenarios', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  
  // Financial Data
  principal: real('principal').notNull(),
  currency: text('currency').default("CAD"),
  termMonths: integer('term_months').notNull(),
  
  // Configuration
  paymentFrequency: text('payment_frequency').notNull(), // 'MONTHLY', 'BIWEEKLY', 'WEEKLY'
  rateSource: text('rate_source').notNull(),             // 'FIXED', 'MARKET_AI'

  // Rates (Nullable depending on source)
  fixedAnnualRate: real('fixed_annual_rate'),            
  spreadOverPolicyRate: real('spread_over_policy_rate'), 

  extraPaymentPerPeriod: real('extra_payment_per_period'),

  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});