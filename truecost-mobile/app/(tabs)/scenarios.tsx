import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { loanScenarios } from "@/db/schema";
import { desc } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/constants/Colors";
import { calculateLoan } from "@/utils/loanCalculator";

export default function ScenariosScreen() {
  const { data: scenarios } = useLiveQuery(
    db.select().from(loanScenarios).orderBy(desc(loanScenarios.createdAt))
  );

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <View style={styles.container}>
      {/* Custom Header matching the new Design System */}
      <View style={styles.header}>
        <Text style={styles.title}>Loan Models</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/compare')}>
            <Ionicons name="git-compare-outline" size={22} color={AppColors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.addBtn]} onPress={() => router.push('/scenarios/add')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList 
        data={scenarios || []}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No models yet.</Text>
            <Text style={styles.emptySub}>Tap + to simulate a loan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          // Using centralized logic
          const stats = calculateLoan({
            principal: item.principal,
            months: item.termMonths,
            rate: item.fixedAnnualRate || 0.05,
            frequency: item.paymentFrequency
          });

          return (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push(`/scenarios/${item.id}`)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    {formatMoney(item.principal)} • {item.termMonths}mo • {item.rateSource === 'FIXED' ? 'Fixed' : 'Var'}
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
  container: { flex: 1, backgroundColor: AppColors.background, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: AppColors.primary },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  addBtn: { backgroundColor: AppColors.accent },
  
  card: { backgroundColor: AppColors.surface, borderRadius: 20, marginBottom: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: AppColors.text.primary },
  cardSub: { fontSize: 13, color: AppColors.text.secondary, marginTop: 4 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: AppColors.secondary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: AppColors.text.secondary },
  
  divider: { height: 1, backgroundColor: AppColors.secondary, marginVertical: 16 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontSize: 12, fontWeight: '600', color: AppColors.text.light, textTransform: 'uppercase' },
  costRight: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  costValue: { fontSize: 16, fontWeight: '700', color: AppColors.accent },
  costRatio: { fontSize: 12, color: AppColors.text.secondary },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', color: AppColors.text.primary },
  emptySub: { fontSize: 14, color: AppColors.text.secondary, marginTop: 4 },
});