import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/client';
import { expenses } from '../../db/schema';

const CATEGORIES = ["Food", "Transport", "Housing", "Fun", "Shopping", "Bills"];

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("Food");

  const handleSave = async () => {
    if (!amount) return;
    await db.insert(expenses).values({
      amount: parseFloat(amount),
      category: selectedCategory,
      description: description || 'Expense',
      date: new Date(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Big Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>$</Text>
          <TextInput 
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Categories */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.catButton, 
                selectedCategory === cat && styles.catButtonActive
              ]}
            >
              <Text style={[
                styles.catText,
                selectedCategory === cat && styles.catTextActive
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Details</Text>
        <TextInput 
          style={styles.textInput} 
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Expense</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },

  content: { padding: 24 },
  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  currency: { fontSize: 40, fontWeight: '700', color: '#cbd5e1', marginRight: 8 },
  amountInput: { fontSize: 60, fontWeight: '700', color: '#0f172a', minWidth: 100, textAlign: 'center' },

  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  catButton: { width: '30%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  catButtonActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  catTextActive: { color: '#fff' },

  textInput: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 30 },

  saveBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});