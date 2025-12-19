import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../../db/client";
import { loanScenarios } from "../../db/schema";
import { desc } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AiTipsCard from "../../components/AiTipsCard";
import { fetchAiInsights } from "../../services/gemini";

export default function DashboardScreen() {
  const { data: scenarios } = useLiveQuery(
    db.select().from(loanScenarios).orderBy(desc(loanScenarios.createdAt))
  );

  const scenarioList = useMemo(() => scenarios || [], [scenarios]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [forecast, setForecast] = useState<string>("Neutral");

  const kpiStats = useMemo(() => {
    const totalPrincipal = scenarioList.reduce((acc, s) => acc + (s.principal || 0), 0);
    const fixedRateScenarios = scenarioList.filter(s => s.fixedAnnualRate !== null);
    const avgRateDecimal = fixedRateScenarios.length > 0
      ? (fixedRateScenarios.reduce((acc, s) => acc + (s.fixedAnnualRate || 0), 0) / fixedRateScenarios.length)
      : 0;
    const avgRatePercent = avgRateDecimal * 100;
    return { totalPrincipal, avgRatePercent, count: scenarioList.length };
  }, [scenarioList]);

  useEffect(() => {
    let cancelled = false;
    const loadAi = async () => {
      const ai = await fetchAiInsights(scenarioList);
      if (!cancelled) {
        setAiTips(ai.tips);
        setForecast(ai.forecast);
      }
    };
    loadAi();
    return () => {
      cancelled = true;
    };
  }, [scenarioList]);

  const recentScenarios = scenarioList.slice(0, 3);
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header Section */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Financial Overview</Text>
          <Text style={styles.headerSubtitle}>Track exposure & simulate outcomes.</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/scenarios/add')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Grid */}
      <View style={styles.gridContainer}>
        {/* Card 1: Total Principal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Total Modeled Debt</Text>
              <Text style={styles.cardValue}>{formatMoney(kpiStats.totalPrincipal)}</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="wallet-outline" size={22} color="#2563eb" />
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.footerTrendText}>
              <Ionicons name="trending-up" size={12} /> {kpiStats.count}
            </Text>
            <Text style={styles.footerText}> active scenarios</Text>
          </View>
        </View>

        {/* Card 2: Average Rate */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Avg. Fixed Rate</Text>
              <Text style={styles.cardValue}>{kpiStats.avgRatePercent.toFixed(2)}%</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
              <Ionicons name="pulse-outline" size={22} color="#9333ea" />
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(kpiStats.avgRatePercent * 10, 100)}%` }]} />
          </View>
          <Text style={styles.footerTextDesc}>Exposure across fixed rate loans</Text>
        </View>
      </View>

      {/* Market Outlook */}
      <View style={styles.outlookCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.outlookLabel}>Market Outlook</Text>
            <Text style={styles.outlookValue}>{forecast}</Text>
          </View>
          <View style={styles.outlookIconBox}>
            <Ionicons name="business-outline" size={22} color="#fff" />
          </View>
        </View>
        <Text style={styles.outlookDesc}>{forecast}</Text>
      </View>

      {/* AI Tips Section */}
      <View style={styles.sectionMargin}>
        <AiTipsCard tips={aiTips} />
      </View>

      {/* Recent Scenarios List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Scenarios</Text>
        </View>
        
        {recentScenarios.length === 0 && (
          <Text style={styles.emptyText}>No scenarios found.</Text>
        )}

        {recentScenarios.map((s) => (
          // CLICKABLE ROW
          <TouchableOpacity 
            key={s.id} 
            style={styles.listItem}
            onPress={() => router.push(`/scenarios/${s.id}`)}
          >
            <View style={styles.listItemLeft}>
              <View style={styles.listIconBox}>
                <Ionicons name="trending-up-outline" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.itemName}>{s.name}</Text>
                <Text style={styles.itemSub}>
                  {formatMoney(s.principal)} · {s.rateSource === 'FIXED' ? 'Fixed' : 'Variable'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={styles.viewAllBtn} 
          onPress={() => router.push('/(tabs)/scenarios')}
        >
          <Text style={styles.viewAllText}>View All Scenarios</Text>
          <Ionicons name="arrow-forward" size={14} color="#475569" />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 4 },
  gridContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  iconBox: { padding: 8, borderRadius: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  footerTrendText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  footerText: { color: '#64748b', fontSize: 12 },
  footerTextDesc: { color: '#94a3b8', fontSize: 11, marginTop: 8 },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#a855f7', borderRadius: 3 },
  outlookCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  outlookLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 4 },
  outlookValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  outlookIconBox: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  outlookDesc: { color: '#94a3b8', fontSize: 12, marginTop: 12, lineHeight: 18 },
  sectionMargin: { marginBottom: 16 },
  listContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  listHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  emptyText: { padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  itemSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  viewAllBtn: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#475569' },
});
