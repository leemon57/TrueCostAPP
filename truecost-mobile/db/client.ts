import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

// Opens (or creates) a local file named 'truecost.db'
const expoDb = openDatabaseSync('truecost.db');

export const db = drizzle(expoDb);