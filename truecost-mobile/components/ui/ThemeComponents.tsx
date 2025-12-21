import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '@/constants/Colors';

// --- 1. Standard Header ---
export const ScreenHeader = ({ title, showBack = true }: { title: string; showBack?: boolean }) => (
  <View style={styles.header}>
    {showBack && (
      <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
        <Ionicons name="close" size={24} color={AppColors.text.primary} />
      </TouchableOpacity>
    )}
    <Text style={styles.headerTitle}>{title}</Text>
    {showBack && <View style={{ width: 40 }} />} 
  </View>
);

// --- 2. Standard Input ---
interface AppInputProps extends TextInputProps {
  label?: string;
}
export const AppInput = ({ label, style, ...props }: AppInputProps) => (
  <View style={styles.inputContainer}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput 
      style={[styles.input, style]} 
      placeholderTextColor={AppColors.text.light}
      {...props} 
    />
  </View>
);

// --- 3. Standard Buttons ---
export const AppButton = ({ title, onPress, variant = 'primary', disabled }: { title: string, onPress: () => void, variant?: 'primary' | 'secondary', disabled?: boolean }) => (
  <TouchableOpacity 
    style={[
      styles.btn, 
      variant === 'primary' ? styles.btnPrimary : styles.btnSecondary,
      disabled && styles.btnDisabled
    ]} 
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.btnText, variant === 'secondary' && styles.btnTextSecondary]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20,
    marginBottom: 20
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text.primary },
  iconBtn: { padding: 8, backgroundColor: AppColors.secondary, borderRadius: 20 },

  // Input Styles
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.text.secondary, marginBottom: 8 },
  input: { 
    backgroundColor: AppColors.secondary, 
    padding: 16, 
    borderRadius: 16, 
    fontSize: 16, 
    color: AppColors.text.primary 
  },

  // Button Styles
  btn: { padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: AppColors.primary },
  btnSecondary: { backgroundColor: AppColors.secondary },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: AppColors.text.inverse, fontWeight: '700', fontSize: 16 },
  btnTextSecondary: { color: AppColors.text.primary },
});