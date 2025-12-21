import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '@/constants/Colors';

export default function SubscriptionsTab() {
  const { data } = useLiveQuery(db.select().from(subscriptions));

  // Calculate monthly cost for the header
  const totalMonthly = useMemo(() => {
    return data?.reduce((acc, sub) => {
      const monthlyAmount = sub.billingCycle === 'YEARLY' ? sub.amount / 12 : sub.amount;
      return acc + monthlyAmount;
    }, 0) || 0;
  }, [data]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Subscription", `Stop tracking ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          await db.delete(subscriptions).where(eq(subscriptions.id, id));
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Tab Header with Total */}
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>Subscriptions</Text>
            <Text style={styles.subtitle}>${totalMonthly.toFixed(2)} / month</Text>
        </View>
      </View>

      <FlatList 
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>No subscriptions yet.</Text>}
        renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBg}>
                  <Ionicons name="sync" size={20} color={AppColors.accent} />
                </View>
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.details}>{item.billingCycle} • ${item.amount}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
              </TouchableOpacity>
            </View>
        )}
      />

      {/* FIXED: Bottom is set to 110 to sit ABOVE the tab bar */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/subscriptions/add')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add New</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, backgroundColor: AppColors.background },
  title: { fontSize: 32, fontWeight: '800', color: AppColors.text.primary },
  subtitle: { fontSize: 16, color: AppColors.text.secondary, fontWeight: '600', marginTop: 4 },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: AppColors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: AppColors.border, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.secondary, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
  details: { fontSize: 13, color: AppColors.text.secondary },
  deleteBtn: { padding: 10, opacity: 0.8 },
  
  empty: { textAlign: 'center', color: AppColors.text.secondary, marginTop: 40 },
  
  // High zIndex and larger bottom margin to clear the Tab Bar
  fab: { position: 'absolute', bottom: 110, right: 20, backgroundColor: AppColors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, elevation: 5, zIndex: 100 },
  fabText: { color: '#fff', fontWeight: '600' }
});