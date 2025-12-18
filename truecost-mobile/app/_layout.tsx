import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../db/client';
import migrations from '../drizzle/migrations'; // You'll generate this with drizzle-kit
import { Text, View } from 'react-native';

export default function RootLayout() {
  // Optional: Run migrations on startup (or just use db.push in dev)
  // const { success, error } = useMigrations(db, migrations);

  // if (!success) return <View><Text>Migrating DB...</Text></View>;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="expenses/add" options={{ presentation: 'modal', title: 'Add Expense' }} />
    </Stack>
  );
}
