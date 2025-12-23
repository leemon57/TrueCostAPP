import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { expenses, loanScenarios, subscriptions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AppColors } from "@/constants/Colors";
import AiTipsCard from "@/components/AiTipsCard";
import { calculateLoan, PAYMENTS_PER_YEAR } from "@/utils/loanCalculator";

const DEFAULT_ANNUAL_RATE = 0.05;

export default function DashboardScreen() {
  const { data: recentExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date)).limit(5)
  );
  const { data: allScenarios } = useLiveQuery(db.select().from(loanScenarios));
  const { data: allSubs } = useLiveQuery(db.select().from(subscriptions));

  // Placeholder AI Data (Connect to real logic in services/gemini.ts later)
  const [aiTips] = useState<string[]>([
    "Your food spending is 15% lower than last week. Great job!",
    "You have a recurring subscription for 'Netflix' coming up on Friday."
  ]);

  const stats = useMemo(() => {
    // 1. Expenses (Current Month Approximation for demo)
    const monthExpenses = recentExpenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
    
    // 2. Subs (Monthly)
    const monthlySubs = allSubs?.reduce((acc, s) => {
      return s.isActive ? acc + (s.billingCycle === 'MONTHLY' ? s.amount : s.amount / 12) : acc;
    }, 0) || 0;

    // 3. Loans (Monthly)
    const monthlyLoans = allScenarios?.reduce((acc, s) => {
        const frequency = (s.paymentFrequency || 'MONTHLY').toUpperCase();
        const paymentsPerYear =
          PAYMENTS_PER_YEAR[frequency as keyof typeof PAYMENTS_PER_YEAR] ?? PAYMENTS_PER_YEAR.MONTHLY;

        // Use shared utility for consistency
        const loanStats = calculateLoan({
          principal: s.principal,
          months: s.termMonths,
          rate: s.fixedAnnualRate ?? DEFAULT_ANNUAL_RATE,
          frequency
        });

        // Normalize to an average monthly cash outlay (frequency-aware)
        const normalizedMonthly = loanStats.payment * (paymentsPerYear / 12);
        return acc + normalizedMonthly;
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Overview</Text>
          <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Quick Calculator Button */}
            <TouchableOpacity 
                style={styles.iconBtn} 
                onPress={() => router.push('/scenarios/add')}
            >
                <Ionicons name="calculator-outline" size={24} color={AppColors.text.primary} />
            </TouchableOpacity>

            {/* Profile/Settings Button */}
            <TouchableOpacity onPress={() => router.push('/settings')}>
                <Ionicons name="person-circle-outline" size={32} color={AppColors.primary} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Main Total */}
      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Total Monthly Spend</Text>
        <Text style={styles.totalValue}>{formatMoney(stats.total)}</Text>
      </View>

      {/* Clickable Breakdown Cards */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.touchableCard} onPress={() => router.push('/calendar')}>
          <View style={styles.statCard}>
            <Ionicons name="cart-outline" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{formatMoney(stats.expenses)}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.touchableCard} onPress={() => router.push('/subscriptions')}>
          <View style={styles.statCard}>
            <Ionicons name="sync-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{formatMoney(stats.fixed)}</Text>
            <Text style={styles.statLabel}>Subs</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.touchableCard} onPress={() => router.push('/scenarios')}>
          <View style={styles.statCard}>
            <Ionicons name="home-outline" size={20} color="#6366f1" />
            <Text style={styles.statValue}>{formatMoney(stats.loans)}</Text>
            <Text style={styles.statLabel}>Loans</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* AI Tips Card */}
      <View style={{ marginBottom: 24 }}>
        <AiTipsCard tips={aiTips} />
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/calendar')}>
          <Text style={styles.linkText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {(!recentExpenses || recentExpenses.length === 0) && (
          <Text style={styles.emptyText}>No recent expenses.</Text>
        )}
        {recentExpenses?.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="pricetag-outline" size={18} color={AppColors.text.secondary} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  contentContainer: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 28, fontWeight: '700', color: AppColors.text.primary },
  date: { fontSize: 16, color: AppColors.text.secondary },
  
  iconBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: AppColors.surface, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border
  },

  totalBadge: { alignItems: 'center', marginBottom: 24, backgroundColor: AppColors.surface, padding: 16, borderRadius: 16 },
  totalLabel: { fontSize: 12, color: AppColors.text.secondary, fontWeight: '600', textTransform: 'uppercase' },
  totalValue: { fontSize: 32, fontWeight: '800', color: AppColors.text.primary },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  touchableCard: { flex: 1 }, 
  statCard: { backgroundColor: AppColors.surface, padding: 16, borderRadius: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, width: '100%' },
  statValue: { fontSize: 16, fontWeight: '700', color: AppColors.text.primary },
  statLabel: { fontSize: 12, color: AppColors.text.secondary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text.primary },
  linkText: { color: AppColors.accent, fontWeight: '600' },
  list: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 8 },
  emptyText: { padding: 20, textAlign: 'center', color: AppColors.text.secondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.secondary },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.secondary, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontWeight: '600', color: AppColors.text.primary },
  rowSubtitle: { fontSize: 12, color: AppColors.text.secondary },
  rowAmount: { fontWeight: '600', color: AppColors.text.primary },
});
