import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/client';
import { loanScenarios } from '../../db/schema';

export default function ScenarioDetailScreen() {
  const { id } = useLocalSearchParams();
  
  // Fetch specific scenario
  const { data } = useLiveQuery(
    db.select().from(loanScenarios).where(eq(loanScenarios.id, id as string))
  );
  const scenario = data?.[0];

  const handleDelete = async () => {
    Alert.alert("Delete Scenario", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          await db.delete(loanScenarios).where(eq(loanScenarios.id, id as string));
          router.back();
        }
      }
    ]);
  };

  // Recalculate Projections for Display
  const stats = useMemo(() => {
    if (!scenario) return null;
    const paymentsPerYear =
      scenario.paymentFrequency === 'BIWEEKLY' ? 26 : scenario.paymentFrequency === 'WEEKLY' ? 52 : 12;
    const periods = (scenario.termMonths / 12) * paymentsPerYear;
    if (!periods) return null;

    const principal = scenario.principal;
    const annualRate = scenario.fixedAnnualRate || 0;
    const ratePerPeriod = annualRate / paymentsPerYear;

    let paymentPerPeriod = 0;
    if (annualRate === 0) paymentPerPeriod = principal / periods;
    else
      paymentPerPeriod =
        principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, periods)) /
        (Math.pow(1 + ratePerPeriod, periods) - 1);

    const totalPaid = paymentPerPeriod * periods;
    return {
      totalInterest: totalPaid - principal,
      paymentPerPeriod,
      totalPaid,
      paymentsPerYear,
    };
  }, [scenario]);

  if (!scenario || !stats) return <View style={styles.container}><Text>Loading...</Text></View>;

  const paymentLabel = (() => {
    switch (scenario.paymentFrequency) {
      case 'BIWEEKLY':
        return 'Bi-weekly Payment';
      case 'WEEKLY':
        return 'Weekly Payment';
      default:
        return 'Monthly Payment';
    }
  })();

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{scenario.name}</Text>
        <Text style={styles.subtitle}>Created {new Date(scenario.createdAt!).toLocaleDateString()}</Text>

        {/* Big Impact Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{paymentLabel}</Text>
          <Text style={styles.cardValueBig}>{formatMoney(stats.paymentPerPeriod)}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <View>
              <Text style={styles.cardLabel}>Total Interest</Text>
              <Text style={styles.cardValue}>{formatMoney(stats.totalInterest)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardLabel}>Total Cost</Text>
              <Text style={styles.cardValue}>{formatMoney(stats.totalPaid)}</Text>
            </View>
          </View>
        </View>

        {/* Details Grid */}
        <Text style={styles.sectionTitle}>Loan Terms</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Principal</Text>
            <Text style={styles.gridValue}>{formatMoney(scenario.principal)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Rate</Text>
            <Text style={styles.gridValue}>{(scenario.fixedAnnualRate! * 100).toFixed(2)}%</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Duration</Text>
            <Text style={styles.gridValue}>{scenario.termMonths} mo</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Frequency</Text>
            <Text style={styles.gridValue}>{scenario.paymentFrequency}</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  iconBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },

  card: { backgroundColor: '#0f172a', borderRadius: 20, padding: 24, marginBottom: 32, shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 10 },
  cardLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardValueBig: { color: '#fff', fontSize: 36, fontWeight: '700' },
  cardValue: { color: '#10b981', fontSize: 18, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  gridLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
});
