import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper to generate stable, collision-resistant IDs (UUID v4-ish)
const generateId = () => {
  const cryptoObj = (globalThis as any)?.crypto;

  if (typeof cryptoObj?.randomUUID === 'function') return cryptoObj.randomUUID();

  const getRandomValues: ((typedArray: Uint8Array) => Uint8Array) | undefined =
    typeof cryptoObj?.getRandomValues === 'function'
      ? cryptoObj.getRandomValues.bind(cryptoObj)
      : undefined;

  const bytes = getRandomValues
    ? Array.from(getRandomValues(new Uint8Array(16)))
    : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

  // Variant and version bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = (n: number) => n.toString(16).padStart(2, '0');

  return (
    hex(bytes[0]) +
    hex(bytes[1]) +
    hex(bytes[2]) +
    hex(bytes[3]) +
    '-' +
    hex(bytes[4]) +
    hex(bytes[5]) +
    '-' +
    hex(bytes[6]) +
    hex(bytes[7]) +
    '-' +
    hex(bytes[8]) +
    hex(bytes[9]) +
    '-' +
    hex(bytes[10]) +
    hex(bytes[11]) +
    hex(bytes[12]) +
    hex(bytes[13]) +
    hex(bytes[14]) +
    hex(bytes[15])
  );
};

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
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
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
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Subscriptions (New) ---
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
