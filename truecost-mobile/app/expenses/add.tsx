import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import CategoryChip from '@/components/ui/CategoryChip';

const CATEGORIES = ["Food", "Transport", "Bills", "Health", "Shopping", "Entertainment", "Other"];

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSave = async (addAnother = false) => {
    if (!amount || !category) return;

    await db.insert(expenses).values({
      amount: parseFloat(amount),
      category,
      description: note,
      date: new Date(),
      imageUri
    });

    if (addAnother) {
      setAmount('');
      setCategory('');
      setNote('');
      setImageUri(null);
    } else {
      router.back();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>New Expense</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            autoFocus
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Categories */}
        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.map(c => (
            <CategoryChip 
              key={c} 
              label={c} 
              selected={category === c} 
              onPress={() => setCategory(c)} 
            />
          ))}
        </ScrollView>

        {/* Details */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionLabel}>Note (Optional)</Text>
          <TextInput 
            style={styles.textInput} 
            placeholder="What was this for?" 
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Receipt Image */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Ionicons name="camera-outline" size={20} color="#64748b" />
          <Text style={styles.imageBtnText}>{imageUri ? 'Change Receipt' : 'Add Receipt Photo'}</Text>
        </TouchableOpacity>
        
        {imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.thumb} />
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImage}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSave(true)}>
          <Text style={styles.secondaryBtnText}>+ Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, (!amount || !category) && styles.disabledBtn]} onPress={() => handleSave(false)}>
          <Text style={styles.primaryBtnText}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  title: { fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 24 },
  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: '#94a3b8', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', color: '#0f172a', minWidth: 100, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  chipScroll: { flexDirection: 'row', marginBottom: 24, height: 50 }, // Fixed height for scroll
  formGroup: { marginBottom: 24 },
  textInput: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 16 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, gap: 8, marginBottom: 16 },
  imageBtnText: { color: '#64748b', fontWeight: '500' },
  imagePreview: { position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: 4, right: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 12, paddingBottom: 40 },
  primaryBtn: { flex: 2, backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryBtn: { flex: 1, backgroundColor: '#f1f5f9', padding: 18, borderRadius: 16, alignItems: 'center' },
  secondaryBtnText: { color: '#0f172a', fontWeight: '600' },
});