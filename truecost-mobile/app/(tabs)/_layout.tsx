import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol'; // Or use Ionicons directly if preferred
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme'; 
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = '#10b981'; // Emerald 500

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <Ionicons name="pie-chart-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Scenarios',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}