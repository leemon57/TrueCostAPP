import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/client';
import { loanScenarios } from '../../db/schema';

type Frequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
type RateSource = 'FIXED' | 'CENTRAL_BANK_BASELINE' | 'MARKET_AI';

export default function AddScenarioScreen() {
  const [form, setForm] = useState({
    name: '',
    principal: '',
    termMonths: '',
    rate: '', // Fixed rate OR Spread
  });
  
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [rateSource, setRateSource] = useState<RateSource>('FIXED');

  // --- Live Calculation ---
  const projection = useMemo(() => {
    const P = parseFloat(form.principal) || 0;
    const rateInput = parseFloat(form.rate) || 0;
    const r_annual = rateInput > 1 ? rateInput / 100 : rateInput; // accept percentage or decimal
    const months = parseFloat(form.termMonths) || 0;
    
    if (P === 0 || months === 0) return { totalInterest: 0, payment: 0 };

    let paymentsPerYear = 12;
    if (frequency === 'BIWEEKLY') paymentsPerYear = 26;
    if (frequency === 'WEEKLY') paymentsPerYear = 52;

    const r_period = r_annual / paymentsPerYear;
    const n_periods = (months / 12) * paymentsPerYear;

    let payment = 0;
    if (r_annual === 0) payment = P / n_periods;
    else payment = P * (r_period * Math.pow(1 + r_period, n_periods)) / (Math.pow(1 + r_period, n_periods) - 1);

    const totalPaid = payment * n_periods;
    return { 
      totalInterest: totalPaid - P, 
      payment: payment 
    };
  }, [form, frequency]);

  const handleSave = async () => {
    if (!form.name || !form.principal) return;

    const rateInput = parseFloat(form.rate) || 0;
    const rateValue = rateInput > 1 ? rateInput / 100 : rateInput; // store as decimal

    await db.insert(loanScenarios).values({
      name: form.name,
      principal: parseFloat(form.principal),
      termMonths: parseInt(form.termMonths) || 12,
      paymentFrequency: frequency,
      rateSource: rateSource,
      // If Fixed, save to fixedAnnualRate. If Var, save to spread.
      fixedAnnualRate: rateSource === 'FIXED' ? rateValue : null,
      spreadOverPolicyRate: rateSource !== 'FIXED' ? rateValue : null,
      currency: 'CAD',
      includeInTotals: true, // Default to true
    }).run();
    
    router.back();
  };

  const renderOption = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.optionBtn, selected && styles.optionBtnSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>New Model</Text>
        </View>

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

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Scenario Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Tesla Model 3" 
            value={form.name}
            onChangeText={t => setForm({...form, name: t})} 
          />

          <Text style={styles.label}>Principal Amount ($)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0.00" 
            keyboardType="numeric"
            value={form.principal}
            onChangeText={t => setForm({...form, principal: t})} 
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Term (Months)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="60" 
                keyboardType="numeric"
                value={form.termMonths}
                onChangeText={t => setForm({...form, termMonths: t})} 
              />
            </View>
          </View>

          {/* Payment Frequency */}
          <Text style={styles.label}>Payment Frequency</Text>
          <View style={styles.optionsRow}>
            {renderOption('Monthly', frequency === 'MONTHLY', () => setFrequency('MONTHLY'))}
            {renderOption('Bi-Weekly', frequency === 'BIWEEKLY', () => setFrequency('BIWEEKLY'))}
            {renderOption('Weekly', frequency === 'WEEKLY', () => setFrequency('WEEKLY'))}
          </View>

          {/* Rate Source */}
          <Text style={[styles.label, { marginTop: 16 }]}>Interest Rate Type</Text>
          <View style={styles.optionsRow}>
            {renderOption('Fixed', rateSource === 'FIXED', () => setRateSource('FIXED'))}
            {renderOption('Variable', rateSource !== 'FIXED', () => setRateSource('MARKET_AI'))}
          </View>

          {/* Rate Input */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>
              {rateSource === 'FIXED' ? 'Annual Interest Rate (%)' : 'Spread Over Prime (%)'}
            </Text>
            <TextInput 
              style={styles.input} 
              placeholder="8.99" 
              keyboardType="numeric"
              value={form.rate}
              onChangeText={t => setForm({...form, rate: t})} 
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Scenario</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },

  impactCard: { margin: 20, marginTop: 0, padding: 20, backgroundColor: '#0f172a', borderRadius: 16 },
  impactTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  impactRow: { flexDirection: 'row', justifyContent: 'space-between' },
  impactLabel: { color: '#cbd5e1', fontSize: 12 },
  impactValue: { color: '#10b981', fontSize: 24, fontWeight: '700', marginTop: 4 },

  form: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, marginBottom: 16 },
  row: { flexDirection: 'row' },
  
  optionsRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  optionBtnSelected: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  optionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  optionTextSelected: { color: '#fff' },

  saveBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});