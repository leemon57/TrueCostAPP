import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SubscriptionListScreen() {
  const { data } = useLiveQuery(db.select().from(subscriptions));

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Subscription", `Stop tracking ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Remove", 
        style: "destructive", 
        onPress: async () => {
          await db.delete(subscriptions).where(eq(subscriptions.id, id));
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: typeof subscriptions.$inferSelect }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconBg}>
          <Ionicons name="sync" size={20} color="#3b82f6" />
        </View>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>{item.billingCycle} • ${item.amount}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Subscriptions</Text>
      </View>

      <FlatList 
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No subscriptions found.</Text>}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/subscriptions/add')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add New</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  details: { fontSize: 13, color: '#64748b' },
  deleteBtn: { padding: 10 },
  
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  
  fab: { position: 'absolute', bottom: 40, right: 20, backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#0f172a', shadowOpacity: 0.3, elevation: 5 },
  fabText: { color: '#fff', fontWeight: '600' }
});