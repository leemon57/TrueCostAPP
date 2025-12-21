import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/Colors';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.accent,
        tabBarInactiveTintColor: AppColors.text.secondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', height: 60 + insets.bottom, paddingTop: 8, backgroundColor: AppColors.surface, borderTopColor: AppColors.border },
          default: { height: 70, paddingBottom: 12, paddingTop: 12, backgroundColor: AppColors.surface, borderTopColor: AppColors.border },
        }),
      }}>
      
      {/* 1. HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />

      {/* 2. BUDGET */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <Ionicons name="pie-chart-outline" size={24} color={color} />,
        }}
      />

      {/* 3. CENTER ADD BUTTON */}
      <Tabs.Screen
        name="add_placeholder"
        options={{
          title: '',
          // Use flex: 1 and alignItems: center to perfectly center it in the slot
          tabBarButton: () => (
            <View style={styles.fabWrapper}>
              <TouchableOpacity 
                style={styles.fab}
                onPress={() => router.push('/expenses/add')}
              >
                <Ionicons name="add" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      {/* 4. CALENDAR */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />

      {/* 5. SETTINGS */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />

      {/* HIDDEN TABS */}
      <Tabs.Screen name="scenarios" options={{ href: null }} />
      <Tabs.Screen name="subscriptions" options={{ href: null }} />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    // FIXED: Flex 1 ensures it fills the tab slot width
    flex: 1, 
    // FIXED: Center alignment ensures the button sits in the middle
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Shifts the button up to float
    top: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
