import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Fetch all expenses (optimally you'd filter by month range in SQL)
  const { data: allExpenses } = useLiveQuery(db.select().from(expenses));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  const getExpensesForDay = (date: Date) => {
    return allExpenses?.filter(e => isSameDay(e.date, date)) || [];
  };

  const selectedDayExpenses = getExpensesForDay(selectedDate);

  const renderDay = ({ item }: { item: Date }) => {
    const hasExpense = getExpensesForDay(item).length > 0;
    const isSelected = isSameDay(item, selectedDate);
    
    return (
      <TouchableOpacity 
        style={[styles.dayCell, isSelected && styles.selectedDay]} 
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{format(item, 'd')}</Text>
        {hasExpense && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => router.push('/subscriptions/add')}>
            <Ionicons name="repeat" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarGrid}>
        <View style={styles.weekRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
             <Text key={i} style={styles.weekHeader}>{d}</Text>
          ))}
        </View>
        <FlatList
          data={daysInMonth}
          renderItem={renderDay}
          keyExtractor={item => item.toISOString()}
          numColumns={7}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{format(selectedDate, 'EEEE, MMM d')}</Text>
        <FlatList
          data={selectedDayExpenses}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No spending recorded.</Text>}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseCategory}>{item.category}</Text>
                {item.description && <Text style={styles.expenseNote}>{item.description}</Text>}
              </View>
              <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  calendarGrid: { paddingHorizontal: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekHeader: { width: 40, textAlign: 'center', color: '#94a3b8', fontWeight: '600' },
  dayCell: { width: '13.5%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20, margin: '0.3%' },
  selectedDay: { backgroundColor: '#0f172a' },
  dayText: { fontSize: 16, color: '#334155' },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginTop: 4 },
  detailContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  detailTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#0f172a' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic' },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  expenseCategory: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  expenseNote: { fontSize: 12, color: '#64748b' },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
});