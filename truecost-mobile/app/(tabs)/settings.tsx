import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/db/client';
import { expenses, budgetProfiles, loanScenarios, subscriptions } from '@/db/schema';
import { AppColors } from '@/constants/Colors';
// Import the new utility functions
import { backupData, restoreData } from '@/utils/backup';

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

  const SettingsItem = ({ icon, label, onPress, danger }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
           <Ionicons name={icon} size={20} color={danger ? AppColors.danger : AppColors.text.primary} />
        </View>
        <Text style={[styles.rowLabel, danger && { color: AppColors.danger }]}>{label}</Text>
      </View>
      {!danger && <Ionicons name="chevron-forward" size={20} color={AppColors.text.light} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <SettingsItem icon="person-outline" label="Edit Profile & Income" onPress={() => router.push('/onboarding')} />
      </View>

      <View style={styles.section}>
        <SettingsItem icon="cloud-upload-outline" label="Backup Data" onPress={backupData} />
        <SettingsItem icon="cloud-download-outline" label="Restore Data" onPress={restoreData} />
      </View>

      <View style={styles.section}>
        <SettingsItem icon="trash-outline" label="Clear All Data" onPress={handleClearData} danger />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: 60, padding: 20 },
  header: { fontSize: 32, fontWeight: '800', marginBottom: 24, color: AppColors.text.primary },
  section: { backgroundColor: AppColors.surface, borderRadius: 20, marginBottom: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: AppColors.secondary, justifyContent: 'center', alignItems: 'center' },
  iconBoxDanger: { backgroundColor: '#fee2e2' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
});