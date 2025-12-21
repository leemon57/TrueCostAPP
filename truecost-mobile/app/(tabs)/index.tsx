import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { expenses, loanScenarios, subscriptions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AppColors } from "@/constants/Colors";
import { calculateLoan } from "@/utils/loanCalculator"; // Ensure we use the shared utility

export default function DashboardScreen() {
  const { data: recentExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date)).limit(5)
  );
  const { data: allScenarios } = useLiveQuery(db.select().from(loanScenarios));
  const { data: allSubs } = useLiveQuery(db.select().from(subscriptions));

  const stats = useMemo(() => {
    const monthExpenses = recentExpenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
    
    const monthlySubs = allSubs?.reduce((acc, s) => {
      // Calculate monthly cost for subscriptions
      const cost = s.billingCycle === 'YEARLY' ? s.amount / 12 : s.amount;
      return acc + cost;
    }, 0) || 0;

    const monthlyLoans = allScenarios?.reduce((acc, s) => {
      // Use shared utility for consistency
      const loanStats = calculateLoan({
        principal: s.principal,
        months: s.termMonths,
        rate: s.fixedAnnualRate || 0.05,
        frequency: s.paymentFrequency
      });
      // Convert to monthly equivalent if needed, but calculateLoan returns 'payment' per period.
      // We need strictly monthly for the dashboard.
      // A quick approximation for the dashboard total:
      const annualCost = loanStats.payment * (s.paymentFrequency === 'BIWEEKLY' ? 26 : s.paymentFrequency === 'WEEKLY' ? 52 : 12);
      return acc + (annualCost / 12);
    }, 0) || 0;

    return {
      expenses: monthExpenses,
      fixed: monthlySubs,
      loans: monthlyLoans,
      total: monthExpenses + monthlySubs + monthlyLoans
    };
  }, [recentExpenses, allSubs, allScenarios]);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Overview</Text>
          <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
        </View>
        {/* FIXED: Added onPress to navigate to settings */}
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/settings')}>
           <Ionicons name="person-circle-outline" size={32} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Stats Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Monthly Spend</Text>
        <Text style={styles.totalValue}>{formatMoney(stats.total)}</Text>
        
        <View style={styles.statsRow}>
            <StatItem icon="cart" label="Expenses" value={stats.expenses} color="#f59e0b" />
            <View style={styles.divider} />
            <StatItem icon="sync" label="Subs" value={stats.fixed} color="#3b82f6" />
            <View style={styles.divider} />
            <StatItem icon="home" label="Loans" value={stats.loans} color="#6366f1" />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/calendar')}>
          <Text style={styles.linkText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {(!recentExpenses || recentExpenses.length === 0) ? (
          <Text style={styles.emptyText}>No expenses yet.</Text>
        ) : recentExpenses.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="pricetag" size={16} color={AppColors.text.secondary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>{e.category}</Text>
                <Text style={styles.rowSubtitle}>{e.description || format(e.date, 'MMM d')}</Text>
              </View>
            </View>
            <Text style={styles.rowAmount}>{formatMoney(e.amount)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Helper component for the stats row
const StatItem = ({ icon, label, value, color }: any) => (
    <View style={styles.statItem}>
        <Ionicons name={icon} size={18} color={color} style={{marginBottom: 4}}/>
        <Text style={styles.statValue}>${Math.round(value)}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '800', color: AppColors.primary, letterSpacing: -0.5 },
  date: { fontSize: 15, color: AppColors.text.secondary, fontWeight: '500' },
  profileBtn: { opacity: 0.8 },
  
  totalCard: { backgroundColor: AppColors.surface, borderRadius: 24, padding: 24, marginBottom: 32, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: {width:0, height:4} },
  totalLabel: { fontSize: 14, color: AppColors.text.secondary, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  totalValue: { fontSize: 36, fontWeight: '800', color: AppColors.primary, textAlign: 'center', marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  divider: { width: 1, backgroundColor: AppColors.border, height: '80%' },
  statValue: { fontSize: 16, fontWeight: '700', color: AppColors.primary },
  statLabel: { fontSize: 12, color: AppColors.text.secondary, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.primary },
  linkText: { color: AppColors.accent, fontWeight: '600' },
  
  list: { backgroundColor: AppColors.surface, borderRadius: 20, padding: 4, overflow: 'hidden' },
  emptyText: { padding: 24, textAlign: 'center', color: AppColors.text.light },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.secondary },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.secondary, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontWeight: '600', color: AppColors.primary, fontSize: 15 },
  rowSubtitle: { fontSize: 13, color: AppColors.text.secondary },
  rowAmount: { fontWeight: '600', color: AppColors.primary, fontSize: 15 },
});
