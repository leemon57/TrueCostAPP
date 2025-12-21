import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../../db/client";
import { loanScenarios } from "../../db/schema";
import { desc } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ScenariosScreen() {
  const { data: scenarios } = useLiveQuery(
    db.select().from(loanScenarios).orderBy(desc(loanScenarios.createdAt))
  );

  // Helper to replicate the Web's Math Engine for the card display
  const getProjections = (s: typeof loanScenarios.$inferSelect) => {
    const P = s.principal;
    const r_annual = s.fixedAnnualRate || 0.05; // Default fallback
    const freq = s.paymentFrequency;
    const months = s.termMonths;

    let paymentsPerYear = 12;
    if (freq === "BIWEEKLY") paymentsPerYear = 26;
    if (freq === "WEEKLY") paymentsPerYear = 52;

    const r_period = r_annual / paymentsPerYear;
    const n_periods = (months / 12) * paymentsPerYear;

    let payment = 0;
    if (r_annual === 0) payment = P / n_periods;
    else payment = P * (r_period * Math.pow(1 + r_period, n_periods)) / (Math.pow(1 + r_period, n_periods) - 1);

    const totalPaid = payment * n_periods;
    const totalInterest = totalPaid - P;
    const ratio = P > 0 ? (totalInterest / P) * 100 : 0;

    return { totalInterest, ratio };
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Loan Scenarios</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* COMPARE BUTTON */}
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: '#fff' }]} 
            onPress={() => router.push('/compare')}
          >
            <Ionicons name="git-compare-outline" size={22} color="#0f172a" />
          </TouchableOpacity>

          {/* ADD BUTTON */}
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: '#10b981' }]} 
            onPress={() => router.push('/scenarios/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList 
        data={scenarios || []}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No scenarios yet.</Text>
            <Text style={styles.emptySub}>Tap + to simulate a loan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stats = getProjections(item);
          return (
            // WRAPPED IN TOUCHABLE OPACITY
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push(`/scenarios/${item.id}`)}
              style={styles.card}
            >
              <View style={styles.cardMain}>
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    {formatMoney(item.principal)} / {item.termMonths}mo / {item.rateSource === 'FIXED' ? 'Fixed' : 'Var'}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.paymentFrequency.substring(0,1)}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardFooter}>
                <Text style={styles.costLabel}>Total Interest</Text>
                <View style={styles.costRight}>
                  <Text style={styles.costValue}>{formatMoney(stats.totalInterest)}</Text>
                  <Text style={styles.costRatio}>(+{stats.ratio.toFixed(1)}%)</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' },
  costRight: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  costValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  costRatio: { fontSize: 12, color: '#64748b' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 4 },
});
