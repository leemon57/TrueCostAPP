import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '@/constants/Colors';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: allExpenses } = useLiveQuery(db.select().from(expenses));

  // --- Month Navigation ---
  const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  const getExpensesForDay = (date: Date) => allExpenses?.filter(e => isSameDay(e.date, date)) || [];
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
        {hasExpense && <View style={[styles.dot, isSelected && { backgroundColor: AppColors.accent }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={AppColors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
        
        <View style={{flexDirection: 'row', gap: 12}}>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color={AppColors.text.primary} />
            </TouchableOpacity>
            
            {/* Add Sub/Expense Button */}
            <TouchableOpacity onPress={() => router.push('/expenses/add')} style={styles.addBtn}>
                <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
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
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 20, fontWeight: '700', color: AppColors.text.primary },
  navBtn: { padding: 4 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center' },
  
  calendarGrid: { paddingHorizontal: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekHeader: { width: 40, textAlign: 'center', color: AppColors.text.secondary, fontWeight: '600' },
  dayCell: { width: '13.5%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20, margin: '0.3%' },
  selectedDay: { backgroundColor: AppColors.primary },
  dayText: { fontSize: 16, color: AppColors.text.primary },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: AppColors.text.light, marginTop: 4 },
  
  detailContainer: { flex: 1, backgroundColor: AppColors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  detailTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: AppColors.text.primary },
  emptyText: { color: AppColors.text.secondary, fontStyle: 'italic' },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.secondary },
  expenseCategory: { fontSize: 16, fontWeight: '500', color: AppColors.text.primary },
  expenseNote: { fontSize: 12, color: AppColors.text.secondary },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: AppColors.text.primary },
});