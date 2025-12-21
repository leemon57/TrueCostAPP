import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/client';
import { loanScenarios } from '../../db/schema';
import { AppColors } from '@/constants/Colors';
import { ScreenHeader, AppInput, AppButton } from '@/components/ui/ThemeComponents';

type Frequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
type RateSource = 'FIXED' | 'CENTRAL_BANK_BASELINE' | 'MARKET_AI';

export default function AddScenarioScreen() {
  const [form, setForm] = useState({ name: '', principal: '', termMonths: '', rate: '' });
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [rateSource, setRateSource] = useState<RateSource>('FIXED');

  // --- Live Calculation (Logic kept same) ---
  const projection = useMemo(() => {
    const P = parseFloat(form.principal) || 0;
    const rateInput = parseFloat(form.rate) || 0;
    const r_annual = rateInput > 1 ? rateInput / 100 : rateInput;
    const months = parseFloat(form.termMonths) || 0;
    
    if (P === 0 || months === 0) return { totalInterest: 0, payment: 0 };

    let paymentsPerYear = frequency === 'BIWEEKLY' ? 26 : frequency === 'WEEKLY' ? 52 : 12;
    const r_period = r_annual / paymentsPerYear;
    const n_periods = (months / 12) * paymentsPerYear;

    let payment = r_annual === 0 ? P / n_periods : P * (r_period * Math.pow(1 + r_period, n_periods)) / (Math.pow(1 + r_period, n_periods) - 1);
    return { totalInterest: (payment * n_periods) - P, payment: payment };
  }, [form, frequency]);

  const handleSave = async () => {
    if (!form.name || !form.principal) return;
    const rateInput = parseFloat(form.rate) || 0;
    const rateValue = rateInput > 1 ? rateInput / 100 : rateInput;

    await db.insert(loanScenarios).values({
      name: form.name,
      principal: parseFloat(form.principal),
      termMonths: parseInt(form.termMonths) || 12,
      paymentFrequency: frequency,
      rateSource,
      fixedAnnualRate: rateSource === 'FIXED' ? rateValue : null,
      spreadOverPolicyRate: rateSource !== 'FIXED' ? rateValue : null,
      currency: 'CAD',
      includeInTotals: true,
    }).run();
    router.back();
  };

  const OptionBtn = ({ label, selected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.optionBtn, selected && styles.optionBtnSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: AppColors.background }}>
      <ScreenHeader title="New Loan Model" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Impact Card */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Live Projection</Text>
          <View style={styles.impactRow}>
            <View>
              <Text style={styles.impactLabel}>Total Interest</Text>
              <Text style={styles.impactValue}>${projection.totalInterest.toFixed(0)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.impactLabel}>Payment ({frequency.toLowerCase()})</Text>
              <Text style={styles.impactValue}>${projection.payment.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Form Inputs */}
        <AppInput label="Scenario Name" placeholder="e.g. Tesla Model 3" value={form.name} onChangeText={t => setForm({...form, name: t})} />
        <AppInput label="Principal Amount ($)" placeholder="0.00" keyboardType="numeric" value={form.principal} onChangeText={t => setForm({...form, principal: t})} />
        
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
             <AppInput label="Term (Months)" placeholder="60" keyboardType="numeric" value={form.termMonths} onChangeText={t => setForm({...form, termMonths: t})} />
          </View>
        </View>

        <Text style={styles.label}>Payment Frequency</Text>
        <View style={styles.optionsRow}>
          <OptionBtn label="Monthly" selected={frequency === 'MONTHLY'} onPress={() => setFrequency('MONTHLY')} />
          <OptionBtn label="Bi-Weekly" selected={frequency === 'BIWEEKLY'} onPress={() => setFrequency('BIWEEKLY')} />
          <OptionBtn label="Weekly" selected={frequency === 'WEEKLY'} onPress={() => setFrequency('WEEKLY')} />
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Interest Rate Type</Text>
        <View style={styles.optionsRow}>
          <OptionBtn label="Fixed" selected={rateSource === 'FIXED'} onPress={() => setRateSource('FIXED')} />
          <OptionBtn label="Variable" selected={rateSource !== 'FIXED'} onPress={() => setRateSource('MARKET_AI')} />
        </View>

        <View style={{ marginTop: 16 }}>
           <AppInput 
             label={rateSource === 'FIXED' ? 'Annual Interest Rate (%)' : 'Spread Over Prime (%)'} 
             placeholder="8.99" 
             keyboardType="numeric"
             value={form.rate} 
             onChangeText={t => setForm({...form, rate: t})} 
            />
        </View>

        <View style={{ marginTop: 24, marginBottom: 40 }}>
           <AppButton title="Save Scenario" onPress={handleSave} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20 },
  impactCard: { padding: 20, backgroundColor: AppColors.primary, borderRadius: 16, marginBottom: 24 },
  impactTitle: { color: AppColors.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  impactRow: { flexDirection: 'row', justifyContent: 'space-between' },
  impactLabel: { color: AppColors.text.light, fontSize: 12 },
  impactValue: { color: AppColors.accent, fontSize: 24, fontWeight: '700', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.text.secondary, marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 12 },
  optionsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  optionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', backgroundColor: AppColors.surface },
  optionBtnSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  optionText: { fontSize: 13, fontWeight: '600', color: AppColors.text.secondary },
  optionTextSelected: { color: AppColors.text.inverse },
});