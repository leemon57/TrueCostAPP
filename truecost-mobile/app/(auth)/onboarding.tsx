import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { budgetProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    incomeType: 'SALARY', // 'SALARY' | 'HOURLY'
    salaryAmount: '',
    hourlyRate: '',
    hoursPerWeek: '',
    currency: 'CAD',
  });

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Save Profile
      await saveData();
    }
  };

  const saveData = async () => {
    try {
      // Create a default user first if none exists (simplified for local-first)
      const existing = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);
      let userId = existing[0]?.id;

      if (!userId) {
        await db.insert(users).values({ email: 'user@local', name: 'User' }).onConflictDoNothing().run();
        const created = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);
        userId = created[0]?.id;
      }

      const salaryAmount = formData.salaryAmount ? parseFloat(formData.salaryAmount) : 0;
      const hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : 0;
      const hoursPerWeek = formData.hoursPerWeek ? parseFloat(formData.hoursPerWeek) : 0;
      const monthlyIncome = formData.incomeType === 'SALARY'
        ? salaryAmount / 12
        : (hourlyRate * hoursPerWeek * 52) / 12;

      const existingProfile = await db
        .select()
        .from(budgetProfiles)
        .where(eq(budgetProfiles.userId, userId!))
        .limit(1);

      if (existingProfile.length > 0) {
        await db
          .update(budgetProfiles)
          .set({
            monthlyIncome,
            fixedExpenses: existingProfile[0].fixedExpenses ?? 0,
            variableExpenses: existingProfile[0].variableExpenses ?? 0,
            savingsPerMonthTarget: existingProfile[0].savingsPerMonthTarget ?? 0,
            emergencyFund: existingProfile[0].emergencyFund ?? 0,
            incomeType: formData.incomeType,
            salaryAmount,
            hourlyRate,
            hoursPerWeek,
            payFrequency: existingProfile[0].payFrequency ?? 'MONTHLY',
            updatedAt: new Date(),
          })
          .where(eq(budgetProfiles.id, existingProfile[0].id))
          .run();
      } else {
        await db
          .insert(budgetProfiles)
          .values({
            userId,
            monthlyIncome,
            fixedExpenses: 0,
            variableExpenses: 0,
            savingsPerMonthTarget: 0,
            emergencyFund: 0,
            incomeType: formData.incomeType,
            salaryAmount,
            hourlyRate,
            hoursPerWeek,
            payFrequency: 'MONTHLY',
            updatedAt: new Date(),
          })
          .run();
      }
      
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>Step {step} of 2</Text>
            <Text style={styles.title}>
              {step === 1 ? "How do you earn?" : "Let's crunch the numbers"}
            </Text>
          </View>

        {step === 1 && (
          <View style={styles.choiceContainer}>
            <TouchableOpacity 
              style={[styles.card, formData.incomeType === 'SALARY' && styles.selectedCard]}
              onPress={() => setFormData({...formData, incomeType: 'SALARY'})}
            >
              <Ionicons name="briefcase-outline" size={32} color={formData.incomeType === 'SALARY' ? '#10b981' : '#64748b'} />
              <Text style={styles.cardLabel}>Annual Salary</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, formData.incomeType === 'HOURLY' && styles.selectedCard]}
              onPress={() => setFormData({...formData, incomeType: 'HOURLY'})}
            >
              <Ionicons name="time-outline" size={32} color={formData.incomeType === 'HOURLY' ? '#10b981' : '#64748b'} />
              <Text style={styles.cardLabel}>Hourly Wage</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContainer}>
            {formData.incomeType === 'SALARY' ? (
              <View>
                <Text style={styles.label}>Annual Income (After Tax Estimate)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 65000"
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  value={formData.salaryAmount}
                  onChangeText={(t) => setFormData({...formData, salaryAmount: t})}
                />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.label}>Hourly Rate ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25.00"
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                    value={formData.hourlyRate}
                    onChangeText={(t) => setFormData({...formData, hourlyRate: t})}
                  />
                </View>
                <View>
                  <Text style={styles.label}>Hours per Week</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="40"
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                    value={formData.hoursPerWeek}
                    onChangeText={(t) => setFormData({...formData, hoursPerWeek: t})}
                  />
                </View>
              </View>
            )}
          </View>
        )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{step === 2 ? "Start Tracking" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  header: { marginBottom: 40 },
  stepIndicator: { color: '#64748b', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  choiceContainer: { flexDirection: 'row', gap: 16 },
  card: { flex: 1, backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 2, borderColor: '#e2e8f0' },
  selectedCard: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  cardLabel: { fontWeight: '600', color: '#334155' },
  formContainer: { gap: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, fontSize: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  nextBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
