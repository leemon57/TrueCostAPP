import { openDatabaseSync } from 'expo-sqlite';

export async function initializeDb() {
  const db = openDatabaseSync('truecost.db');

  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
        updated_at INTEGER
      );

      -- Budget Profiles Table
      CREATE TABLE IF NOT EXISTS budget_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT REFERENCES users(id),
        monthly_income REAL NOT NULL,
        fixed_expenses REAL NOT NULL,
        variable_expenses REAL NOT NULL,
        savings_per_month_target REAL,
        emergency_fund REAL NOT NULL,
        updated_at INTEGER
      );

      -- Expenses Table
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date INTEGER NOT NULL,
        category TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
      );

      -- Loan Scenarios Table
      CREATE TABLE IF NOT EXISTS loan_scenarios (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        principal REAL NOT NULL,
        currency TEXT DEFAULT 'CAD',
        term_months INTEGER NOT NULL,
        payment_frequency TEXT NOT NULL,
        rate_source TEXT NOT NULL,
        fixed_annual_rate REAL,
        spread_over_policy_rate REAL,
        extra_payment_per_period REAL,
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
        updated_at INTEGER
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
