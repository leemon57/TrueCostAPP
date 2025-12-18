import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '../../db/client';
import { expenses } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Link, router } from 'expo-router';
import AiTipsCard from '../../components/AiTipsCard';
import ExpenseList from '../../components/ExpenseList';

export default function DashboardScreen() {
  // This hook automatically updates the UI when the database changes!
  const { data } = useLiveQuery(
    db.select().from(expenses).orderBy(desc(expenses.date))
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>TrueCost Mobile</Text>
        <Button title="+ Add" onPress={() => router.push('/expenses/add')} />
      </View>

      <AiTipsCard tips={["Spending is 10% lower than last month.", "Try reducing dining out."]} />

      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      <ExpenseList expenses={data} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  welcome: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
});
