// app/settings.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { db } from '../db/client';
import { budgetProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState({
    monthlyIncome: '',
    fixedExpenses: '',
    variableExpenses: '',
    savingsTarget: '',
    emergencyFund: '',
  });

  useEffect(() => {
    // Load existing data
    const loadProfile = async () => {
      try {
        const profiles = await db.select().from(budgetProfiles).limit(1);
        if (profiles.length > 0) {
          const p = profiles[0];
          setProfileId(p.id);
          setForm({
            monthlyIncome: p.monthlyIncome.toString(),
            fixedExpenses: p.fixedExpenses.toString(),
            variableExpenses: p.variableExpenses.toString(),
            savingsTarget: (p.savingsPerMonthTarget || 0).toString(),
            emergencyFund: p.emergencyFund.toString(),
          });
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    };
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    if (!profileId) return;

    try {
      await db.update(budgetProfiles)
        .set({
          monthlyIncome: parseFloat(form.monthlyIncome) || 0,
          fixedExpenses: parseFloat(form.fixedExpenses) || 0,
          variableExpenses: parseFloat(form.variableExpenses) || 0,
          savingsPerMonthTarget: parseFloat(form.savingsTarget) || 0,
          emergencyFund: parseFloat(form.emergencyFund) || 0,
        })
        .where(eq(budgetProfiles.id, profileId));

      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Budget Parameters</Text>
        
        <Text style={styles.label}>Monthly Net Income ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.monthlyIncome}
          onChangeText={(t) => setForm({ ...form, monthlyIncome: t })}
        />

        <Text style={styles.label}>Fixed Expenses ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.fixedExpenses}
          onChangeText={(t) => setForm({ ...form, fixedExpenses: t })}
        />

        <Text style={styles.label}>Variable Expenses ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.variableExpenses}
          onChangeText={(t) => setForm({ ...form, variableExpenses: t })}
        />

        <Text style={styles.label}>Savings Target ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.savingsTarget}
          onChangeText={(t) => setForm({ ...form, savingsTarget: t })}
        />

        <Text style={styles.label}>Emergency Fund ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.emergencyFund}
          onChangeText={(t) => setForm({ ...form, emergencyFund: t })}
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 16 },
  form: { gap: 16, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});