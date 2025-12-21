import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import CategoryChip from '@/components/ui/CategoryChip';
import { AppColors } from '@/constants/Colors';
import { ScreenHeader, AppInput, AppButton } from '@/components/ui/ThemeComponents';

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
    addAnother ? (setAmount(''), setCategory(''), setNote(''), setImageUri(null)) : router.back();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New Expense" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Big Amount Input */}
        <View style={styles.amountWrapper}>
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
            <CategoryChip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        <AppInput label="Note (Optional)" placeholder="What was this for?" value={note} onChangeText={setNote} />

        {/* Image Picker */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Ionicons name="camera-outline" size={20} color={AppColors.text.secondary} />
          <Text style={styles.imageBtnText}>{imageUri ? 'Change Receipt' : 'Add Receipt Photo'}</Text>
        </TouchableOpacity>
        
        {imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.thumb} />
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImage}>
              <Ionicons name="close-circle" size={24} color={AppColors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}><AppButton title="+ Another" variant="secondary" onPress={() => handleSave(true)} /></View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 2 }}><AppButton title="Save Expense" onPress={() => handleSave(false)} disabled={!amount || !category} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  content: { padding: 24 },
  amountWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: AppColors.text.light, marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', color: AppColors.text.primary, minWidth: 100, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: AppColors.text.secondary, marginBottom: 12 },
  chipScroll: { flexDirection: 'row', marginBottom: 24, height: 50 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, gap: 8, marginBottom: 16 },
  imageBtnText: { color: AppColors.text.secondary, fontWeight: '500' },
  imagePreview: { width: 100, height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  thumb: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: 4, right: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: AppColors.border, flexDirection: 'row', paddingBottom: 40 },
});
