import { openDatabaseSync } from 'expo-sqlite';

export async function initializeDb() {
  const db = openDatabaseSync('truecost.db', { enableChangeListener: true });

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

      -- Budget Profiles Table (Updated for Hourly/Salary logic)
      CREATE TABLE IF NOT EXISTS budget_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT REFERENCES users(id),
        monthly_income REAL,
        fixed_expenses REAL,
        variable_expenses REAL,
        savings_per_month_target REAL,
        emergency_fund REAL,
        income_type TEXT NOT NULL DEFAULT 'SALARY',
        salary_amount REAL,
        hourly_rate REAL,
        hours_per_week REAL,
        pay_frequency TEXT,
        currency TEXT DEFAULT 'CAD',
        updated_at INTEGER
      );

      -- Expenses Table
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date INTEGER NOT NULL,
        category TEXT NOT NULL,
        image_uri TEXT,
        user_id TEXT REFERENCES users(id),
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
      );

      -- Subscriptions Table (New)
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT DEFAULT 'Subscriptions',
        billing_cycle TEXT NOT NULL,
        first_bill_date INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
      );

      -- Loan Scenarios Table (Updated with include_in_totals)
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
        include_in_totals BOOLEAN DEFAULT 1,
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
        updated_at INTEGER
      );
    `);

    const profileColumns = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info('budget_profiles');`
    );
    const columnNames = new Set(profileColumns.map((col) => col.name));

    const alterStatements: string[] = [];
    if (!columnNames.has('income_type')) {
      alterStatements.push(
        `ALTER TABLE budget_profiles ADD COLUMN income_type TEXT DEFAULT 'SALARY';`
      );
    }
    if (!columnNames.has('monthly_income')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN monthly_income REAL;`);
    }
    if (!columnNames.has('fixed_expenses')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN fixed_expenses REAL;`);
    }
    if (!columnNames.has('variable_expenses')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN variable_expenses REAL;`);
    }
    if (!columnNames.has('savings_per_month_target')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN savings_per_month_target REAL;`);
    }
    if (!columnNames.has('emergency_fund')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN emergency_fund REAL;`);
    }
    if (!columnNames.has('salary_amount')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN salary_amount REAL;`);
    }
    if (!columnNames.has('hourly_rate')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN hourly_rate REAL;`);
    }
    if (!columnNames.has('hours_per_week')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN hours_per_week REAL;`);
    }
    if (!columnNames.has('pay_frequency')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN pay_frequency TEXT;`);
    }
    if (!columnNames.has('currency')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN currency TEXT DEFAULT 'CAD';`);
    }
    if (!columnNames.has('updated_at')) {
      alterStatements.push(`ALTER TABLE budget_profiles ADD COLUMN updated_at INTEGER;`);
    }

    for (const statement of alterStatements) {
      await db.execAsync(statement);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
