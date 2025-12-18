import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '../../db/client';
import { expenses } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';

export default function BudgetScreen() {
  const { data: allExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date))
  );

  const expenseList = allExpenses || [];
  const totalSpent = expenseList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // --- 1. Category Breakdown Logic ---
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    expenseList.forEach(e => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + e.amount);
    });
    
    // Convert to array and sort by amount desc
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ cat, amount, percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseList, totalSpent]);

  // --- 2. Bar Chart Data (Last 7 Days) ---
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
          <Ionicons name="trending-down" size={16} color="#10b981" />
          <Text style={styles.trendText}>Tracking Active</Text>
        </View>
      </View>

      {/* Activity Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.chartArea}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.barGroup}>
              <View style={[styles.bar, { height: (d.value / maxVal) * 100 }]} />
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
          {chartData.length === 0 && <Text style={{color: '#94a3b8'}}>No data yet.</Text>}
        </View>
      </View>

      {/* --- NEW: Category Breakdown --- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Breakdown by Category</Text>
        <View style={styles.breakdownCard}>
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
              <Text style={styles.catPercent}>{item.percent.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {expenseList.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{item.category.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.itemCat}>{item.category}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
            </View>
            <Text style={styles.itemAmount}>-${item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },

  kpiCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  kpiValue: { fontSize: 36, fontWeight: '800', color: '#0f172a', marginVertical: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { color: '#10b981', fontWeight: '600', fontSize: 12 },

  chartCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, paddingBottom: 10 },
  barGroup: { alignItems: 'center', gap: 8, flex: 1 },
  bar: { width: 12, backgroundColor: '#cbd5e1', borderRadius: 6 },
  barLabel: { fontSize: 10, color: '#94a3b8' },

  sectionContainer: { marginBottom: 20 },
  breakdownCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  catRow: { marginBottom: 16 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  progressBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0f172a', borderRadius: 3 },
  catPercent: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  emptyText: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },

  listContainer: { paddingBottom: 40 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  itemCat: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  itemDesc: { fontSize: 12, color: '#94a3b8' },
  itemAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
});