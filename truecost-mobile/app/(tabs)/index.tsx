import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../../db/client";
import { expenses, loanScenarios, subscriptions } from "../../db/schema";
import { desc, sql } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

export default function DashboardScreen() {
  const { data: recentExpenses } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date)).limit(5)
  );
  const { data: allScenarios } = useLiveQuery(db.select().from(loanScenarios));
  const { data: allSubs } = useLiveQuery(db.select().from(subscriptions));

  const stats = useMemo(() => {
    // Simple current month calculation
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // 1. Calculate Expenses for this month (Approximation for demo)
    const monthExpenses = recentExpenses?.reduce((acc, e) => acc + e.amount, 0) || 0;

    // 2. Calculate Monthly Subscription Load
    const monthlySubs = allSubs?.reduce((acc, s) => {
      return s.isActive ? acc + (s.billingCycle === 'MONTHLY' ? s.amount : s.amount / 12) : acc;
    }, 0) || 0;

    // 3. Loan Load (Assuming monthly payment calculation is done or stored)
    // Note: In a real app, you'd calculate exact PMT here. We'll approximate principal/12/term for now if PMT isn't stored.
    const monthlyLoans = allScenarios?.reduce((acc, s) => {
        // Simplified dummy calculation for display if no computed PMT logic exists in DB yet
        const approxPmt = (s.principal * (1 + (s.fixedAnnualRate || 0.05))) / (s.termMonths || 60);
        return acc + approxPmt; 
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
      
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Overview</Text>
          <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total Spend</Text>
          <Text style={styles.totalValue}>{formatMoney(stats.total)}</Text>
        </View>
      </View>

      {/* Breakdown Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="cart-outline" size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{formatMoney(stats.expenses)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="sync-outline" size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{formatMoney(stats.fixed)}</Text>
          <Text style={styles.statLabel}>Subs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="home-outline" size={20} color="#6366f1" />
          <Text style={styles.statValue}>{formatMoney(stats.loans)}</Text>
          <Text style={styles.statLabel}>Loans</Text>
        </View>
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
                <Ionicons name="pricetag-outline" size={18} color="#475569" />
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  date: { fontSize: 16, color: '#64748b' },
  totalBadge: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#10b981' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  linkText: { color: '#10b981', fontWeight: '600' },
  list: { backgroundColor: '#fff', borderRadius: 16, padding: 8 },
  emptyText: { padding: 20, textAlign: 'center', color: '#94a3b8' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontWeight: '600', color: '#0f172a' },
  rowSubtitle: { fontSize: 12, color: '#64748b' },
  rowAmount: { fontWeight: '600', color: '#0f172a' },
});