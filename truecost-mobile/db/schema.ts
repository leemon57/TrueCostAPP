import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Users ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(generateId),
  email: text('email').notNull().unique(), // Can use a dummy email for local-only apps
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

// --- Budget Profile (Onboarding Data) ---
export const budgetProfiles = sqliteTable('budget_profiles', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').references(() => users.id),
  
  // Income details
  monthlyIncome: real('monthly_income'),
  fixedExpenses: real('fixed_expenses'),
  variableExpenses: real('variable_expenses'),
  savingsPerMonthTarget: real('savings_per_month_target'),
  emergencyFund: real('emergency_fund'),
  incomeType: text('income_type').notNull(), // 'SALARY' or 'HOURLY'
  salaryAmount: real('salary_amount'), // Annual or Monthly total
  hourlyRate: real('hourly_rate'),
  hoursPerWeek: real('hours_per_week'),
  payFrequency: text('pay_frequency'), // 'WEEKLY', 'BIWEEKLY', 'MONTHLY'
  currency: text('currency').default('CAD'),

  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

// --- Expenses ---
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(generateId),
  amount: real('amount').notNull(),
  description: text('description'), // Note
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  imageUri: text('image_uri'), // Path to local receipt image
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Subscriptions (New) ---
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').default('Subscriptions'),
  billingCycle: text('billing_cycle').notNull(), // 'MONTHLY', 'YEARLY'
  firstBillDate: integer('first_bill_date', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
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
  paymentFrequency: text('payment_frequency').notNull(), 
  rateSource: text('rate_source').notNull(),             

  // Rates
  fixedAnnualRate: real('fixed_annual_rate'),            
  spreadOverPolicyRate: real('spread_over_policy_rate'), 

  // UX: Include in Calendar?
  includeInTotals: integer('include_in_totals', { mode: 'boolean' }).default(true),

  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});
