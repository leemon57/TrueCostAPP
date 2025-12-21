import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses, budgetProfiles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/Colors';
import { isSameMonth } from 'date-fns';
import { ScreenHeader } from '@/components/ui/ThemeComponents';

export default function BudgetScreen() {
  // 1. Fetch Expenses & User Profile
  const { data: allExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date))
  );
  const { data: profiles } = useLiveQuery(db.select().from(budgetProfiles));
  
  const profile = profiles?.[0];
  const monthlyIncome = profile?.monthlyIncome || 0;
  const savingsTarget = profile?.savingsPerMonthTarget || 0;

  // 2. Filter for Current Month Only
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return allExpenses?.filter(e => isSameMonth(e.date, now)) || [];
  }, [allExpenses]);

  // 3. Calculate Key Metrics
  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = monthlyIncome - totalSpent;
  const spentPercentage = monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0;
  
  // "Safe to Spend" considers your savings goal
  const safeToSpend = remaining - savingsTarget;

  // Category Logic (Current Month)
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    currentMonthExpenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ cat, amount, percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthExpenses, totalSpent]);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Monthly Budget" />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* BUDGET OVERVIEW CARD */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>Monthly Income</Text>
              <Text style={styles.budgetValue}>{formatMoney(monthlyIncome)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={[styles.budgetValue, { color: remaining < 0 ? AppColors.danger : AppColors.accent }]}>
                {formatMoney(remaining)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: spentPercentage > 90 ? AppColors.danger : AppColors.accent }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{spentPercentage.toFixed(1)}% of budget used</Text>
        </View>

        {/* INSIGHTS ROW */}
        <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <Ionicons name="wallet-outline" size={24} color={AppColors.primary} />
                <Text style={styles.statCardValue}>{formatMoney(safeToSpend)}</Text>
                <Text style={styles.statCardLabel}>Safe to Spend</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="save-outline" size={24} color={AppColors.primary} />
                <Text style={styles.statCardValue}>{formatMoney(savingsTarget)}</Text>
                <Text style={styles.statCardLabel}>Savings Goal</Text>
            </View>
        </View>

        {/* CATEGORY BREAKDOWN */}
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.listCard}>
          {categoryStats.length === 0 && <Text style={styles.emptyText}>No spending this month.</Text>}
          {categoryStats.map((item) => (
            <View key={item.cat} style={styles.catRow}>
              <View style={styles.catRowHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.bullet} />
                    <Text style={styles.catName}>{item.cat}</Text>
                </View>
                <Text style={styles.catAmount}>{formatMoney(item.amount)}</Text>
              </View>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, { width: `${item.percent}%` }]} />
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 20 },

  // Budget Card
  budgetCard: { backgroundColor: AppColors.primary, borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: AppColors.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  budgetLabel: { color: AppColors.text.light, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  budgetValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  progressContainer: { height: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 6 },
  progressText: { color: AppColors.text.light, fontSize: 12, textAlign: 'right' },

  // Insights
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: AppColors.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', gap: 8 },
  statCardValue: { fontSize: 20, fontWeight: '800', color: AppColors.text.primary },
  statCardLabel: { fontSize: 12, color: AppColors.text.secondary, fontWeight: '600' },

  // Categories
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text.primary, marginBottom: 16 },
  listCard: { backgroundColor: AppColors.surface, padding: 20, borderRadius: 24 },
  emptyText: { color: AppColors.text.secondary, textAlign: 'center', fontStyle: 'italic' },
  
  catRow: { marginBottom: 20 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.accent },
  catName: { fontSize: 15, fontWeight: '600', color: AppColors.text.primary },
  catAmount: { fontSize: 15, fontWeight: '700', color: AppColors.text.primary },
  catBarBg: { height: 6, backgroundColor: AppColors.secondary, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', backgroundColor: AppColors.primary, borderRadius: 3 },
});