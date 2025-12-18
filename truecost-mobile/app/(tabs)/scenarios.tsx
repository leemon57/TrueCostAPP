import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '../../db/client';
import { loanScenarios } from '../../db/schema';

export default function ScenariosScreen() {
  const { data } = useLiveQuery(db.select().from(loanScenarios));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Loan Scenarios</Text>
      {data.length === 0 && <Text>No scenarios yet.</Text>}
      
      <FlatList 
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text>Principal: ${item.principal}</Text>
            <Text>Payment: ${item.payment.toFixed(2)} / mo</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold' }
});