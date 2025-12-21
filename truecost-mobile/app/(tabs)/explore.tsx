import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/Colors';

export default function BudgetScreen() {
  const { data: allExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date))
  );

  const expenseList = useMemo(() => allExpenses || [], [allExpenses]);
  const totalSpent = expenseList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Category Logic
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    expenseList.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ cat, amount, percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseList, totalSpent]);

  // Chart Logic
  const chartData = expenseList.slice(0, 7).map(e => ({
    label: new Date(e.date!).getDate().toString(),
    value: e.amount,
  })).reverse();
  const maxVal = Math.max(...chartData.map(d => d.value), 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending</Text>
      </View>

      {/* KPI Card */}
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Total Spent (All Time)</Text>
        <Text style={styles.kpiValue}>${totalSpent.toFixed(2)}</Text>
        <View style={styles.trendRow}>
          <Ionicons name="checkmark-circle" size={16} color={AppColors.accent} />
          <Text style={styles.trendText}>Tracking Active</Text>
        </View>
      </View>

      {/* Chart Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Volume</Text>
        <View style={styles.chartArea}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.barGroup}>
              <View style={[styles.bar, { height: (d.value / maxVal) * 100 }]} />
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
          {chartData.length === 0 && <Text style={{color: AppColors.text.secondary}}>No data yet.</Text>}
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.card}>
          {categoryStats.length === 0 && <Text style={styles.emptyText}>No expenses yet.</Text>}
          {categoryStats.map((item) => (
            <View key={item.cat} style={styles.catRow}>
              <View style={styles.catRowHeader}>
                <Text style={styles.catName}>{item.cat}</Text>
                <Text style={styles.catAmount}>${item.amount.toFixed(0)}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, padding: 20 },
  header: { marginTop: 40, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: AppColors.text.primary },
  
  kpiCard: { backgroundColor: AppColors.surface, padding: 24, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: AppColors.text.secondary, textTransform: 'uppercase' },
  kpiValue: { fontSize: 36, fontWeight: '800', color: AppColors.primary, marginVertical: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { color: AppColors.accent, fontWeight: '600', fontSize: 13 },

  card: { backgroundColor: AppColors.surface, padding: 20, borderRadius: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text.primary, marginBottom: 16 },
  
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, paddingBottom: 10 },
  barGroup: { alignItems: 'center', gap: 8, flex: 1 },
  bar: { width: 12, backgroundColor: AppColors.primary, borderRadius: 6, opacity: 0.8 },
  barLabel: { fontSize: 10, color: AppColors.text.secondary },

  sectionContainer: { marginBottom: 20 },
  catRow: { marginBottom: 16 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 14, fontWeight: '600', color: AppColors.text.primary },
  catAmount: { fontSize: 14, fontWeight: '700', color: AppColors.text.primary },
  progressBg: { height: 8, backgroundColor: AppColors.secondary, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: AppColors.primary, borderRadius: 4 },
  emptyText: { color: AppColors.text.secondary, textAlign: 'center', fontSize: 13 },
});