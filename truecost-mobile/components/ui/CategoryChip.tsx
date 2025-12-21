import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CategoryChip({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.chip, selected && styles.selected]} 
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  selected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  text: {
    color: '#64748b',
    fontWeight: '600',
  },
  selectedText: {
    color: '#059669',
  }
});