import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDb } from '../db/init';
import { db } from '@/db/client';
import { budgetProfiles } from '@/db/schema';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        await initializeDb();
        setDbReady(true);
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  // One-time (and route-change) profile check to avoid live re-render loops
  useEffect(() => {
    if (!dbReady) return;
    try {
      const rows = db.select().from(budgetProfiles).limit(1).all();
      setHasProfile(rows.length > 0);
    } catch (e) {
      console.warn('Profile lookup failed', e);
      setHasProfile(false);
    }
  }, [dbReady, segments]);

  useEffect(() => {
    if (!dbReady || hasProfile === null) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';

    if (!hasProfile && !inAuthGroup) {
      // Redirect to onboarding if no profile exists
      router.replace('/(auth)/onboarding');
    } else if (hasProfile && inAuthGroup) {
      // Redirect to home if profile exists
      router.replace('/(tabs)');
    }
  }, [dbReady, hasProfile, segments, router]);

  if (!dbReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        
        {/* Modals */}
        <Stack.Screen name="expenses/add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="subscriptions/add" options={{ presentation: 'modal', headerShown: false }} />
        
        {/* Scenario Screens */}
        <Stack.Screen name="scenarios/add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="scenarios/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="compare/index" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
