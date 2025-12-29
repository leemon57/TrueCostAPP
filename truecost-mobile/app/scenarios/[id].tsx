import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/db/client';
import { loanScenarios } from '@/db/schema';
import { AppColors } from '@/constants/Colors';
import { calculateLoan } from '@/utils/loanCalculator';
import { ScreenHeader } from '@/components/ui/ThemeComponents';

export default function ScenarioDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data } = useLiveQuery(db.select().from(loanScenarios).where(eq(loanScenarios.id, id as string)));
  const scenario = data?.[0];

  if (!scenario) return <View style={styles.container} />;

  const createdDate = scenario.createdAt
    ? new Date(scenario.createdAt)
    : null;

  // 1. Replaced complex useMemo with utility
  const stats = calculateLoan({
    principal: scenario.principal,
    months: scenario.termMonths,
    rate: scenario.fixedAnnualRate || 0,
    frequency: scenario.paymentFrequency
  });

  const handleDelete = () => {
    Alert.alert("Delete Model", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await db.delete(loanScenarios).where(eq(loanScenarios.id, id as string)).run();
          router.back();
      }}
    ]);
  };

  const toggleActive = async (val: boolean) => {
    await db.update(loanScenarios).set({ includeInTotals: val }).where(eq(loanScenarios.id, id as string)).run();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

  return (
    <ScrollView style={styles.container}>
      <ScreenHeader title="Details" showBack />

      <View style={styles.content}>
        <View style={styles.titleRow}>
           <View>
             <Text style={styles.title}>{scenario.name}</Text>
             <Text style={styles.subtitle}>
               Created {createdDate ? createdDate.toLocaleDateString() : 'Unknown'}
             </Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
             <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
           </TouchableOpacity>
        </View>

        {/* Impact Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{scenario.paymentFrequency.toLowerCase()} Payment</Text>
          <Text style={styles.cardValueBig}>{formatMoney(stats.payment)}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.cardLabel}>Interest</Text>
              <Text style={styles.cardValue}>{formatMoney(stats.totalInterest)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardLabel}>Total Cost</Text>
              <Text style={styles.cardValue}>{formatMoney(stats.totalPaid)}</Text>
            </View>
          </View>
        </View>

        {/* Active Toggle */}
        <View style={styles.toggleCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Active in Budget</Text>
                <Text style={styles.toggleSub}>Include in monthly totals</Text>
            </View>
            <Switch 
                value={scenario.includeInTotals || false} 
                onValueChange={toggleActive} 
                trackColor={{ false: AppColors.text.light, true: AppColors.accent }}
            />
        </View>

        {/* Details Grid */}
        <Text style={styles.sectionTitle}>Parameters</Text>
        <View style={styles.grid}>
          <GridItem label="Principal" value={formatMoney(scenario.principal)} />
          <GridItem label="Rate" value={`${(scenario.fixedAnnualRate! * 100).toFixed(2)}%`} />
          <GridItem label="Duration" value={`${scenario.termMonths} mo`} />
          <GridItem label="Frequency" value={scenario.paymentFrequency} />
        </View>
      </View>
    </ScrollView>
  );
}

const GridItem = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.gridItem}>
    <Text style={styles.gridLabel}>{label}</Text>
    <Text style={styles.gridValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: AppColors.text.primary },
  subtitle: { fontSize: 13, color: AppColors.text.secondary },
  deleteBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 12 },

  card: { backgroundColor: AppColors.primary, borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: AppColors.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  cardLabel: { color: AppColors.text.secondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardValueBig: { color: '#fff', fontSize: 36, fontWeight: '700' },
  cardValue: { color: AppColors.accent, fontSize: 18, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: AppColors.border },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
  toggleSub: { fontSize: 13, color: AppColors.text.secondary },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text.primary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', backgroundColor: AppColors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  gridLabel: { fontSize: 12, color: AppColors.text.secondary, marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
});
