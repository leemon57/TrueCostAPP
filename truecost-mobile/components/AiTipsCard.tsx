import { View, Text, StyleSheet } from 'react-native';

export default function AiTipsCard({ tips }: { tips: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💡 AI Insights</Text>
      {tips.map((tip, index) => (
        <Text key={index} style={styles.tipText}>• {tip}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff', // blue-50
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af', // blue-800
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#3b82f6', // blue-600
    marginBottom: 4,
  },
});