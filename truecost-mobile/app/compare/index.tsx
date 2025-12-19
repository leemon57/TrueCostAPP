import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../../db/client";
import { loanScenarios } from "../../db/schema";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CompareScreen() {
  const { data: scenarios } = useLiveQuery(db.select().from(loanScenarios));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(s => s !== id));
    } else {
      if (selectedIds.length < 2) setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedScenarios = scenarios?.filter(s => selectedIds.includes(s.id)) || [];
  
  // Calculate stats with payment frequency considered
  const getStats = (s: typeof loanScenarios.$inferSelect) => {
    const paymentsPerYear = s.paymentFrequency === "BIWEEKLY" ? 26 : s.paymentFrequency === "WEEKLY" ? 52 : 12;
    const periods = (s.termMonths / 12) * paymentsPerYear;
    if (!periods) return { payment: 0, total: 0, interest: 0, label: "Payment" };

    const annualRate = s.fixedAnnualRate || 0;
    const ratePerPeriod = annualRate / paymentsPerYear;
    const principal = s.principal;

    let payment = 0;
    if (annualRate === 0) payment = principal / periods;
    else payment = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, periods)) / (Math.pow(1 + ratePerPeriod, periods) - 1);
    
    const total = payment * periods;
    const label = s.paymentFrequency === "BIWEEKLY" ? "Bi-weekly" : s.paymentFrequency === "WEEKLY" ? "Weekly" : "Monthly";
    return { payment, total, interest: total - s.principal, label };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Models</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.instruct}>Select 2 scenarios to compare:</Text>
        
        {/* Selection List */}
        <View style={styles.list}>
          {scenarios?.map(s => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <TouchableOpacity 
                key={s.id} 
                onPress={() => toggleSelection(s.id)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <View>
                  <Text style={[styles.itemName, isSelected && styles.textSelected]}>{s.name}</Text>
                  <Text style={[styles.itemSub, isSelected && styles.textSelected]}>{`$${s.principal} / ${s.termMonths}mo / ${s.paymentFrequency.toLowerCase()}`}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Comparison View */}
        {selectedScenarios.length === 2 && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Head to Head</Text>
            
            <View style={styles.table}>
              <View style={styles.col}>
                <Text style={styles.colHeader}>{selectedScenarios[0].name}</Text>
                {(() => {
                  const s1 = getStats(selectedScenarios[0]);
                  return (
                    <>
                      <Text style={styles.statLabel}>Payment ({s1.label.toLowerCase()})</Text>
                      <Text style={styles.statValue}>${s1.payment.toFixed(2)}</Text>
                      <Text style={styles.statLabel}>Interest</Text>
                      <Text style={styles.statValue}>${s1.interest.toFixed(0)}</Text>
                    </>
                  )
                })()}
              </View>

              <View style={styles.divider} />

              <View style={styles.col}>
                <Text style={styles.colHeader}>{selectedScenarios[1].name}</Text>
                {(() => {
                  const s2 = getStats(selectedScenarios[1]);
                  return (
                    <>
                      <Text style={styles.statLabel}>Payment ({s2.label.toLowerCase()})</Text>
                      <Text style={styles.statValue}>${s2.payment.toFixed(2)}</Text>
                      <Text style={styles.statLabel}>Interest</Text>
                      <Text style={styles.statValue}>${s2.interest.toFixed(0)}</Text>
                    </>
                  )
                })()}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  
  scroll: { padding: 20 },
  instruct: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  
  list: { gap: 8, marginBottom: 24 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  itemSelected: { borderColor: "#10b981", backgroundColor: "#ecfdf5" },
  itemName: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  itemSub: { fontSize: 12, color: "#64748b" },
  textSelected: { color: "#065f46" },

  result: { backgroundColor: "#0f172a", borderRadius: 16, padding: 20 },
  resultTitle: { color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 16, textAlign: "center" },
  table: { flexDirection: "row" },
  col: { flex: 1, alignItems: "center" },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 10 },
  
  colHeader: { color: "#fff", fontWeight: "700", fontSize: 14, marginBottom: 12, textAlign: "center" },
  statLabel: { color: "#64748b", fontSize: 10, textTransform: "uppercase", marginTop: 8 },
  statValue: { color: "#10b981", fontSize: 18, fontWeight: "700" },
});
