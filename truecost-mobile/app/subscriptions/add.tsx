import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';

export default function AddSubscriptionScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('MONTHLY');

  const handleSave = async () => {
    if (!name || !amount) return;
    await db.insert(subscriptions).values({
      name,
      amount: parseFloat(amount),
      billingCycle: cycle,
      firstBillDate: new Date(),
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Subscription</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Service Name</Text>
        <TextInput style={styles.input} placeholder="Netflix, Spotify..." value={name} onChangeText={setName} />

        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        <View style={styles.cycleRow}>
            {['MONTHLY', 'YEARLY'].map(c => (
                <TouchableOpacity 
                    key={c} 
                    style={[styles.chip, cycle === c && styles.activeChip]}
                    onPress={() => setCycle(c)}
                >
                    <Text style={[styles.chipText, cycle === c && styles.activeChipText]}>{c}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Subscription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontSize: 20, fontWeight: '700' },
  form: { gap: 16 },
  label: { fontWeight: '600', color: '#64748b' },
  input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 16 },
  cycleRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#0f172a' },
  chipText: { fontWeight: '600', color: '#64748b' },
  activeChipText: { color: '#fff' },
  saveBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});