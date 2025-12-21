// app/onboarding.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { db } from '../db/client';
import { users, budgetProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [form, setForm] = useState({
    monthlyIncome: '',
    fixedExpenses: '',
    variableExpenses: '',
    savingsTarget: '',
    emergencyFund: '',
  });

  const handleSave = async () => {
    // Basic validation
    if (!form.monthlyIncome || !form.fixedExpenses) {
      Alert.alert('Missing Info', 'Please fill in at least your Income and Fixed Expenses.');
      return;
    }

    try {
      // 1. Create a default user (since this is local-only)
      // We check if one exists first to avoid duplicates if the app reset partially
      const existingUser = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);

      let userId = existingUser[0]?.id;

      if (!userId) {
        await db.insert(users).values({
          email: 'user@local',
          name: 'Primary User',
        }).onConflictDoNothing();
        const created = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);
        userId = created[0]?.id ?? '';
      }

      const monthlyIncome = parseFloat(form.monthlyIncome) || 0;

      // 2. Create the Budget Profile
      await db.insert(budgetProfiles).values({
        userId: userId,
        monthlyIncome,
        fixedExpenses: parseFloat(form.fixedExpenses) || 0,
        variableExpenses: parseFloat(form.variableExpenses) || 0,
        savingsPerMonthTarget: parseFloat(form.savingsTarget) || 0,
        emergencyFund: parseFloat(form.emergencyFund) || 0,
        incomeType: 'SALARY',
        salaryAmount: monthlyIncome * 12,
        payFrequency: 'MONTHLY',
        currency: 'CAD',
      });

      // 3. Navigate to Dashboard
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding Error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="wallet" size={48} color="#10b981" />
            <Text style={styles.title}>Welcome to TrueCost</Text>
            <Text style={styles.subtitle}>
              Let's set up your financial baseline to help calculate accurate loan scenarios.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Monthly Net Income ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              placeholder="e.g. 5000"
              value={form.monthlyIncome}
              onChangeText={(t) => setForm({ ...form, monthlyIncome: t })}
            />

            <Text style={styles.label}>Fixed Monthly Expenses ($)</Text>
            <Text style={styles.helper}>Rent, mortgage, utilities, subscriptions...</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              placeholder="e.g. 2000"
              value={form.fixedExpenses}
              onChangeText={(t) => setForm({ ...form, fixedExpenses: t })}
            />

            <Text style={styles.label}>Variable Monthly Expenses ($)</Text>
            <Text style={styles.helper}>Groceries, entertainment, dining out...</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              placeholder="e.g. 800"
              value={form.variableExpenses}
              onChangeText={(t) => setForm({ ...form, variableExpenses: t })}
            />

            <Text style={styles.label}>Savings Target / Month ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              placeholder="e.g. 500"
              value={form.savingsTarget}
              onChangeText={(t) => setForm({ ...form, savingsTarget: t })}
            />

            <Text style={styles.label}>Current Emergency Fund ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              placeholder="e.g. 10000"
              value={form.emergencyFund}
              onChangeText={(t) => setForm({ ...form, emergencyFund: t })}
            />

            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155' },
  helper: { fontSize: 12, color: '#94a3b8', marginBottom: 4, marginTop: -12 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
