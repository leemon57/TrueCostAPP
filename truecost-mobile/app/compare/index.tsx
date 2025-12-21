import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { loanScenarios } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/ui/ThemeComponents";
import { calculateLoan } from "@/utils/loanCalculator";

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

  return (
    <View style={styles.container}>
      <ScreenHeader title="Compare Models" showBack />

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
                  <Text style={[styles.itemSub, isSelected && styles.textSelected]}>
                    ${s.principal} / {s.termMonths}mo
                  </Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={AppColors.accent} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Head-to-Head View */}
        {selectedScenarios.length === 2 && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Head to Head</Text>
            
            <View style={styles.table}>
              {selectedScenarios.map((s, index) => {
                // USING SHARED MATH UTILITY
                const stats = calculateLoan({
                    principal: s.principal,
                    months: s.termMonths,
                    rate: s.fixedAnnualRate || 0.05,
                    frequency: s.paymentFrequency
                });
                
                return (
                  <React.Fragment key={s.id}>
                    <View style={styles.col}>
                      <Text style={styles.colHeader}>{s.name}</Text>
                      
                      <Text style={styles.statLabel}>Payment ({s.paymentFrequency.toLowerCase()})</Text>
                      <Text style={styles.statValue}>${stats.payment.toFixed(2)}</Text>
                      
                      <Text style={styles.statLabel}>Total Interest</Text>
                      <Text style={styles.statValue}>${stats.totalInterest.toFixed(0)}</Text>

                      <Text style={styles.statLabel}>True Cost</Text>
                      <Text style={styles.statValue}>${stats.totalPaid.toFixed(0)}</Text>
                    </View>
                    {/* Add divider only between columns */}
                    {index === 0 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 20 },
  instruct: { fontSize: 14, color: AppColors.text.secondary, marginBottom: 12 },
  
  list: { gap: 8, marginBottom: 24 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  itemSelected: { borderColor: AppColors.accent, backgroundColor: '#ecfdf5' }, // Keeping a subtle green tint for selection
  itemName: { fontSize: 16, fontWeight: "600", color: AppColors.text.primary },
  itemSub: { fontSize: 12, color: AppColors.text.secondary },
  textSelected: { color: AppColors.accent },

  result: { backgroundColor: AppColors.primary, borderRadius: 20, padding: 20 },
  resultTitle: { color: AppColors.text.secondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 20, textAlign: "center" },
  table: { flexDirection: "row" },
  col: { flex: 1, alignItems: "center" },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 10 },
  
  colHeader: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 16, textAlign: "center" },
  statLabel: { color: AppColors.text.secondary, fontSize: 10, textTransform: "uppercase", marginTop: 12 },
  statValue: { color: AppColors.accent, fontSize: 18, fontWeight: "700" },
});