import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { db } from '../../db/client';
import { expenses } from '../../db/schema';

export default function AddExpenseScreen() {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    if (!desc || !amount) return;

    await db.insert(expenses).values({
      description: desc,
      amount: parseFloat(amount),
      category: category || 'General',
      date: new Date(),
    });

    router.back(); // Go back to dashboard
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Description" style={styles.input} value={desc} onChangeText={setDesc} />
      <TextInput placeholder="Amount" keyboardType="numeric" style={styles.input} value={amount} onChangeText={setAmount} />
      <TextInput placeholder="Category" style={styles.input} value={category} onChangeText={setCategory} />
      
      <Button title="Save Expense" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
});