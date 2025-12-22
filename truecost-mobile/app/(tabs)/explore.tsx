import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses, budgetProfiles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PieChart } from "react-native-gifted-charts"; 
import { AppColors } from '@/constants/Colors';
import { isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ThemeComponents';

type TimeFrame = 'WEEK' | 'MONTH' | 'YEAR';

export default function BudgetScreen() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTH');
  
  // 1. Fetch Expenses & User Profile
  const { data: allExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date))
  );
  const { data: profiles } = useLiveQuery(db.select().from(budgetProfiles));
  
  // 2. Budget Logic (Strictly Current Month)
  const profile = profiles?.[0];
  const monthlyIncome = profile?.monthlyIncome || 0;
  
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return allExpenses?.filter(e => isSameMonth(e.date, now)) || [];
  }, [allExpenses]);

  const monthSpent = currentMonthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = monthlyIncome - monthSpent;
  const spentPercentage = monthlyIncome > 0 ? (monthSpent / monthlyIncome) * 100 : 0;

  // 3. Pie Chart Logic (Flexible Timeframe)
  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];
    const now = new Date();
    return allExpenses.filter(e => {
      const d = e.date;
      if (timeFrame === 'WEEK') return isSameWeek(d, now);
      if (timeFrame === 'MONTH') return isSameMonth(d, now);
      if (timeFrame === 'YEAR') return isSameYear(d, now);
      return true;
    });
  }, [allExpenses, timeFrame]);

  const pieTotal = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
    
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], index) => ({
        value: amount,
        color: colors[index % colors.length],
        text: cat, 
        percent: pieTotal > 0 ? (amount / pieTotal) * 100 : 0
      }));
  }, [filteredExpenses, pieTotal]);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Budget & Analytics" />

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* --- 1. THE "OLD DESIGN" BUDGET CARD --- */}
        <View style={styles.budgetCard}>
          <Text style={styles.cardTitleWhite}>Current Month Budget</Text>
          
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>Income</Text>
              <Text style={styles.budgetValue}>{formatMoney(monthlyIncome)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={[styles.budgetValue, { color: remaining < 0 ? '#fca5a5' : '#6ee7b7' }]}>
                {formatMoney(remaining)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: spentPercentage > 90 ? '#ef4444' : '#10b981' }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{spentPercentage.toFixed(1)}% used</Text>
        </View>

        {/* --- 2. THE PIE CHART CARD --- */}
        <View style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <Text style={styles.chartTitle}>Spending Breakdown</Text>
             {/* Mini Toggles inside Card */}
             <View style={styles.miniToggleRow}>
                {(['WEEK', 'MONTH', 'YEAR'] as TimeFrame[]).map((t) => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.miniToggle, timeFrame === t && styles.miniToggleActive]}
                    onPress={() => setTimeFrame(t)}
                  >
                    <Text style={[styles.miniToggleText, timeFrame === t && styles.miniToggleTextActive]}>{t[0]}</Text>
                  </TouchableOpacity>
                ))}
             </View>
          </View>
          
          {pieData.length > 0 ? (
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={pieData}
                donut
                radius={100}
                innerRadius={60}
                innerCircleColor={AppColors.surface}
                centerLabelComponent={() => (
                  <View style={{justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 20, fontWeight: 'bold', color: AppColors.text.primary}}>
                      {formatMoney(pieTotal)}
                    </Text>
                    <Text style={{fontSize: 10, color: AppColors.text.secondary}}>Total</Text>
                  </View>
                )}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No data for this period.</Text>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            {pieData.map((item) => (
              <View key={item.text} style={styles.legendRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.text}</Text>
                </View>
                <Text style={styles.legendAmount}>${item.value.toFixed(0)} ({item.percent.toFixed(0)}%)</Text>
              </View>
            ))}
          </View>
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
  cardTitleWhite: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  budgetLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  budgetValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  progressContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' },

  // Chart Card
  chartCard: { backgroundColor: AppColors.surface, borderRadius: 24, padding: 20, marginBottom: 40 },
  chartTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text.primary },
  
  miniToggleRow: { flexDirection: 'row', backgroundColor: AppColors.secondary, borderRadius: 8, padding: 2 },
  miniToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  miniToggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  miniToggleText: { fontSize: 12, fontWeight: '600', color: AppColors.text.secondary },
  miniToggleTextActive: { color: AppColors.primary },

  emptyText: { padding: 40, color: AppColors.text.secondary, fontStyle: 'italic', textAlign: 'center' },
  
  legendContainer: { width: '100%', marginTop: 24, gap: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 14, color: AppColors.text.primary, fontWeight: '500' },
  legendAmount: { fontSize: 14, fontWeight: '700', color: AppColors.text.primary },
});