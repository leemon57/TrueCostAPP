import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { budgetProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/Colors';
import { AppButton, AppInput } from '@/components/ui/ThemeComponents';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ incomeType: 'SALARY', salaryAmount: '', hourlyRate: '', hoursPerWeek: '' });

  const handleNext = async () => {
    if (step < 2) setStep(step + 1);
    else await saveData();
  };

  const saveData = async () => {
    try {
      const existing = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);
      let userId = existing[0]?.id;
      if (!userId) {
        await db.insert(users).values({ email: 'user@local', name: 'User' }).onConflictDoNothing().run();
        const created = await db.select().from(users).where(eq(users.email, 'user@local')).limit(1);
        userId = created[0]?.id;
      }

      const salaryAmount = parseFloat(formData.salaryAmount) || 0;
      const hourlyRate = parseFloat(formData.hourlyRate) || 0;
      const hoursPerWeek = parseFloat(formData.hoursPerWeek) || 0;
      const monthlyIncome = formData.incomeType === 'SALARY' ? salaryAmount / 12 : (hourlyRate * hoursPerWeek * 52) / 12;

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
        await db.insert(budgetProfiles).values({
          userId, monthlyIncome, fixedExpenses: 0, variableExpenses: 0, savingsPerMonthTarget: 0, emergencyFund: 0,
          incomeType: formData.incomeType, salaryAmount, hourlyRate, hoursPerWeek, payFrequency: 'MONTHLY',
          updatedAt: new Date(),
        }).run();
      }
      router.replace('/(tabs)');
    } catch (e) { console.error(e); }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>Step {step} of 2</Text>
            <Text style={styles.title}>{step === 1 ? "How do you earn?" : "Let's crunch numbers"}</Text>
          </View>

        {step === 1 && (
          <View style={styles.choiceContainer}>
            <ChoiceCard 
              label="Annual Salary" 
              icon="briefcase-outline" 
              selected={formData.incomeType === 'SALARY'} 
              onPress={() => setFormData({...formData, incomeType: 'SALARY'})} 
            />
            <ChoiceCard 
              label="Hourly Wage" 
              icon="time-outline" 
              selected={formData.incomeType === 'HOURLY'} 
              onPress={() => setFormData({...formData, incomeType: 'HOURLY'})} 
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContainer}>
            {formData.incomeType === 'SALARY' ? (
                <AppInput label="Annual Income (After Tax)" placeholder="65000" keyboardType="numeric" value={formData.salaryAmount} onChangeText={t => setFormData({...formData, salaryAmount: t})} />
            ) : (
              <>
                <AppInput label="Hourly Rate ($)" placeholder="25.00" keyboardType="numeric" value={formData.hourlyRate} onChangeText={t => setFormData({...formData, hourlyRate: t})} />
                <AppInput label="Hours per Week" placeholder="40" keyboardType="numeric" value={formData.hoursPerWeek} onChangeText={t => setFormData({...formData, hoursPerWeek: t})} />
              </>
            )}
          </View>
        )}

          <View style={{ marginTop: 40 }}>
            <AppButton title={step === 2 ? "Start Tracking" : "Next"} onPress={handleNext} />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const ChoiceCard = ({ label, icon, selected, onPress }: any) => (
  <TouchableOpacity style={[styles.card, selected && styles.selectedCard]} onPress={onPress}>
    <Ionicons name={icon} size={32} color={selected ? AppColors.accent : AppColors.text.secondary} />
    <Text style={[styles.cardLabel, selected && { color: AppColors.text.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  header: { marginBottom: 40 },
  stepIndicator: { color: AppColors.text.secondary, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: AppColors.text.primary },
  choiceContainer: { flexDirection: 'row', gap: 16 },
  card: { flex: 1, backgroundColor: AppColors.surface, padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 2, borderColor: AppColors.border },
  selectedCard: { borderColor: AppColors.accent, backgroundColor: '#ecfdf5' },
  cardLabel: { fontWeight: '600', color: AppColors.text.secondary },
  formContainer: { gap: 8 },
});
