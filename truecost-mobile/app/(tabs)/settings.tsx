import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/db/client';
import { expenses, budgetProfiles, loanScenarios, subscriptions } from '@/db/schema';

export default function SettingsScreen() {
  
  const handleClearData = () => {
    Alert.alert("Reset App", "This will delete all data. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await db.delete(expenses);
          await db.delete(loanScenarios);
          await db.delete(subscriptions);
          await db.delete(budgetProfiles);
          router.replace('/(auth)/onboarding');
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/settings')}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-outline" size={22} color="#0f172a" />
            <Text style={styles.rowLabel}>Edit Profile & Income</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => router.push('/subscriptions')}>
          <View style={styles.rowLeft}>
            <Ionicons name="sync-outline" size={22} color="#0f172a" />
            <Text style={styles.rowLabel}>Manage Subscriptions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleClearData}>
          <View style={styles.rowLeft}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
            <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Clear All Data</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60, padding: 20 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#0f172a' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 8, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 16, fontWeight: '500', color: '#334155' },
});
