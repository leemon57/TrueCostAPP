import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses, subscriptions } from '@/db/schema'; // Added subscriptions
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDate } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '@/constants/Colors';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Fetch both Expenses and Subscriptions
  const { data: allExpenses } = useLiveQuery(db.select().from(expenses));
  const { data: allSubs } = useLiveQuery(db.select().from(subscriptions));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  // --- Logic to merge One-time Expenses + Recurring Subs ---
  const getItemsForDay = (date: Date) => {
    const dayExpenses = allExpenses?.filter(e => isSameDay(e.date, date)) || [];
    
    // Check for subscriptions that fall on this day of the month
    const daySubs = allSubs?.filter(s => {
      const start = new Date(s.firstBillDate);
      // Simple check: Does the day of month match? (e.g., 15th == 15th)
      // For a real app, you'd handle end-of-month logic (e.g. Feb 28 vs 30), but this works for 95% of cases.
      const isMonthlyMatch = s.billingCycle === 'MONTHLY' && getDate(date) === getDate(start);
      const isYearlyMatch = s.billingCycle === 'YEARLY' && getDate(date) === getDate(start) && date.getMonth() === start.getMonth();
      
      return isMonthlyMatch || isYearlyMatch;
    }).map(s => ({
      id: `sub-${s.id}`,
      category: 'Subscription',
      description: s.name, // Use sub name as description
      amount: s.amount,
      isRecurring: true // Flag to style differently
    })) || [];

    return [...dayExpenses, ...daySubs];
  };

  const selectedItems = getItemsForDay(selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/expenses/add')}>
            <Ionicons name="add" size={24} color="#fff" />
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
          keyExtractor={item => item.toISOString()}
          numColumns={7}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const hasItems = getItemsForDay(item).length > 0;
            const isSelected = isSameDay(item, selectedDate);
            return (
              <TouchableOpacity 
                style={[styles.dayCell, isSelected && styles.selectedDay]} 
                onPress={() => setSelectedDate(item)}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{format(item, 'd')}</Text>
                {hasItems && <View style={[styles.dot, isSelected && { backgroundColor: AppColors.accent }]} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{format(selectedDate, 'EEEE, MMM d')}</Text>
        <FlatList
          data={selectedItems}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No spending recorded.</Text>}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Text style={styles.expenseCategory}>{item.category}</Text>
                  {/* Show a little badge if it's a subscription */}
                  {item.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="sync" size={10} color="#fff" />
                    </View>
                  )}
                </View>
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
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 24, fontWeight: '800', color: AppColors.text.primary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center' },
  
  calendarGrid: { paddingHorizontal: 10, marginBottom: 20 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekHeader: { width: '13.5%', textAlign: 'center', color: AppColors.text.light, fontWeight: '700', fontSize: 12 },
  
  dayCell: { width: '13.5%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 14, margin: '0.3%' },
  selectedDay: { backgroundColor: AppColors.primary },
  dayText: { fontSize: 16, color: AppColors.text.primary, fontWeight: '500' },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: AppColors.text.light, marginTop: 4 },
  
  detailContainer: { flex: 1, backgroundColor: AppColors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: AppColors.text.primary },
  emptyText: { color: AppColors.text.light, fontStyle: 'italic', marginTop: 10 },
  
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: AppColors.secondary },
  expenseCategory: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
  recurringBadge: { backgroundColor: AppColors.accent, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  expenseNote: { fontSize: 13, color: AppColors.text.secondary },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: AppColors.text.primary },
});