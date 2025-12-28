import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  tips?: string[];
  forecast?: string;
  loading?: boolean;
  onPress?: () => void;
};

export default function AiTipsCard({ tips = [], forecast, loading = false, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress} disabled={loading}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={16} color="#d97706" />
        </View>
        <Text style={styles.title}>AI Insights</Text>
        {loading && <ActivityIndicator size="small" color="#d97706" />}
      </View>
      
      <View style={styles.content}>
        {forecast ? (
          <Text style={styles.forecastText}>{forecast}</Text>
        ) : null}

        {tips.length > 0 ? (
          tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.bullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.tipText}>No insights available yet.</Text>
        )}

        <Text style={styles.refreshHint}>{loading ? 'Refreshing...' : 'Tap to refresh insights'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffbeb', // amber-50
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcd34d', // amber-300
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e', // amber-800
  },
  content: {
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d97706',
    marginTop: 7,
  },
  tipText: {
    fontSize: 13,
    color: '#b45309', // amber-700
    lineHeight: 18,
    flex: 1,
  },
  forecastText: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 8,
  },
  refreshHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },
});
