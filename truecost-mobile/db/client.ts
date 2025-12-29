import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

// Opens (or creates) a local file named 'truecost.db'
export const expoDb = openDatabaseSync('truecost.db', { enableChangeListener: true });

export const db = drizzle(expoDb);
