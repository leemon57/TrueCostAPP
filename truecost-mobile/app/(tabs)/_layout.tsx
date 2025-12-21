import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/Colors'; // Import centralized colors

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
          default: { height: 60, paddingBottom: 10, backgroundColor: AppColors.surface, borderTopColor: AppColors.border },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      
      {/* Floating Action Button (FAB) */}
      <Tabs.Screen
        name="add_placeholder"
        options={{
          title: '',
          tabBarButton: () => (
            <View style={styles.fabWrapper}>
              <TouchableOpacity 
                style={styles.fab}
                onPress={() => router.push('/expenses/add')}
              >
                <Ionicons name="add" size={32} color={AppColors.text.inverse} />
              </TouchableOpacity>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Subs',
          tabBarIcon: ({ color }) => <Ionicons name="sync-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary, // Using centralized primary color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});