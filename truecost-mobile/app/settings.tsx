// app/settings.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
    incomeType: 'SALARY' as 'SALARY' | 'HOURLY',
    salaryAmount: '',
    hourlyRate: '',
    hoursPerWeek: '',
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
            incomeType: (p.incomeType as 'SALARY' | 'HOURLY') || 'SALARY',
            salaryAmount: (p.salaryAmount ?? '').toString(),
            hourlyRate: (p.hourlyRate ?? '').toString(),
            hoursPerWeek: (p.hoursPerWeek ?? '').toString(),
            fixedExpenses: (p.fixedExpenses ?? 0).toString(),
            variableExpenses: (p.variableExpenses ?? 0).toString(),
            savingsTarget: (p.savingsPerMonthTarget || 0).toString(),
            emergencyFund: (p.emergencyFund ?? 0).toString(),
          });
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    };
    loadProfile();
  }, []);

  const monthlyIncomeDerived = useMemo(() => {
    const salary = parseFloat(form.salaryAmount) || 0;
    const hourly = parseFloat(form.hourlyRate) || 0;
    const hours = parseFloat(form.hoursPerWeek) || 0;

    if (form.incomeType === 'SALARY') return salary / 12;
    if (form.incomeType === 'HOURLY') return (hourly * hours * 52) / 12;
    return 0;
  }, [form]);

  const handleUpdate = async () => {
    if (!profileId) return;

    try {
      await db
        .update(budgetProfiles)
        .set({
          incomeType: form.incomeType,
          salaryAmount: parseFloat(form.salaryAmount) || 0,
          hourlyRate: parseFloat(form.hourlyRate) || 0,
          hoursPerWeek: parseFloat(form.hoursPerWeek) || 0,
          monthlyIncome: monthlyIncomeDerived,
          fixedExpenses: parseFloat(form.fixedExpenses) || 0,
          variableExpenses: parseFloat(form.variableExpenses) || 0,
          savingsPerMonthTarget: parseFloat(form.savingsTarget) || 0,
          emergencyFund: parseFloat(form.emergencyFund) || 0,
          updatedAt: new Date(),
        })
        .where(eq(budgetProfiles.id, profileId))
        .run();

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
        <Text style={styles.sectionTitle}>Income</Text>

        <View style={styles.toggleRow}>
          {(['SALARY', 'HOURLY'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, form.incomeType === type && styles.toggleBtnActive]}
              onPress={() => setForm({ ...form, incomeType: type })}
            >
              <Text style={[styles.toggleText, form.incomeType === type && styles.toggleTextActive]}>
                {type === 'SALARY' ? 'Salary' : 'Hourly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.incomeType === 'SALARY' ? (
          <View>
            <Text style={styles.label}>Annual Salary ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.salaryAmount}
              onChangeText={(t) => setForm({ ...form, salaryAmount: t })}
              placeholder="e.g., 80000"
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={styles.label}>Hourly Rate ($)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.hourlyRate}
                onChangeText={(t) => setForm({ ...form, hourlyRate: t })}
                placeholder="e.g., 25"
              />
            </View>
            <View>
              <Text style={styles.label}>Hours per Week</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.hoursPerWeek}
                onChangeText={(t) => setForm({ ...form, hoursPerWeek: t })}
                placeholder="e.g., 40"
              />
            </View>
          </View>
        )}

        <View style={styles.derivedRow}>
          <Text style={styles.derivedLabel}>Monthly Income (calculated)</Text>
          <Text style={styles.derivedValue}>${monthlyIncomeDerived.toFixed(0)}</Text>
        </View>

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
  toggleRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#0f172a' },
  toggleText: { color: '#0f172a', fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
  derivedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  derivedLabel: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  derivedValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
});
