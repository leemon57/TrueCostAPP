import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { db } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { AppColors } from '@/constants/Colors';
import { ScreenHeader, AppInput, AppButton } from '@/components/ui/ThemeComponents';

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
      <ScreenHeader title="Add Subscription" />

      <View style={styles.content}>
        <AppInput 
          label="Service Name" 
          placeholder="Netflix, Spotify..." 
          value={name} 
          onChangeText={setName} 
          autoFocus
        />
        
        <AppInput 
          label="Amount" 
          placeholder="0.00" 
          keyboardType="decimal-pad" 
          value={amount} 
          onChangeText={setAmount} 
        />

        <Text style={styles.label}>Billing Cycle</Text>
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

        <View style={{ marginTop: 24 }}>
          <AppButton title="Save Subscription" onPress={handleSave} disabled={!name || !amount} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  content: { padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.text.secondary, marginBottom: 12 },
  cycleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: AppColors.secondary },
  activeChip: { backgroundColor: AppColors.primary },
  chipText: { fontWeight: '600', color: AppColors.text.secondary, fontSize: 13 },
  activeChipText: { color: AppColors.text.inverse },
});