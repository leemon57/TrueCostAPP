import { View, Text, FlatList, StyleSheet } from 'react-native';

// Simple list item component
const ExpenseItem = ({ item }: { item: any }) => (
  <View style={styles.item}>
    <View>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
    </View>
    <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
  </View>
);

export default function ExpenseList({ expenses }: { expenses: any[] }) {
  return (
    <View>
      {expenses.map((exp) => (
        <ExpenseItem key={exp.id} item={exp} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  desc: { fontWeight: '600' },
  date: { color: '#888', fontSize: 12 },
  amount: { fontWeight: 'bold' },
});