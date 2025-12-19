import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

// Define the shape of expense data matching your DB
type Expense = {
  id: string;
  amount: number;
  category: string;
  date: Date | null;
};

export default function ExpenseCalendar({ expenses }: { expenses: Expense[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- Calendar Logic ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // --- Data Logic ---
  const getDailyTotal = (day: Date) => {
    return expenses
      .filter(e => e.date && isSameDay(e.date, day))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  const monthlyTotal = expenses
    .filter((e) => e.date && isSameMonth(e.date, currentMonth))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Calculate cell width (Screen width - padding) / 7
  const screenWidth = Dimensions.get('window').width;
  const cellWidth = (screenWidth - 32) / 7; 

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Days Header */}
      <View style={styles.weekRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={[styles.weekDay, { width: cellWidth }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, i) => {
          const total = getDailyTotal(day);
          const isCurrent = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          
          return (
            <View 
              key={day.toISOString()} 
              style={[
                styles.cell, 
                { width: cellWidth, minHeight: cellWidth * 1.2 }, // Aspect ratio
                !isCurrent && styles.cellOutside,
                isTodayDate && styles.cellToday
              ]}
            >
              <Text style={[
                styles.dateNum, 
                !isCurrent && styles.textOutside,
                isTodayDate && styles.textToday
              ]}>
                {format(day, "d")}
              </Text>

              {/* Expense Dot / Pill */}
              {total > 0 && (
                <View style={[
                  styles.expensePill,
                  total > 100 ? styles.pillHigh : styles.pillNormal
                ]}>
                  <Text style={[
                    styles.pillText,
                    total > 100 ? styles.pillTextHigh : styles.pillTextNormal
                  ]} numberOfLines={1}>
                    ${Math.round(total)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Footer Total */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet-outline" size={20} color="#64748b" />
          </View>
          <View>
            <Text style={styles.footerLabel}>Total for {format(currentMonth, "MMMM")}</Text>
            <Text style={styles.footerSub}>
              {expenses.filter(e => e.date && isSameMonth(e.date, currentMonth)).length} transactions
            </Text>
          </View>
        </View>
        <Text style={styles.footerAmount}>
          ${monthlyTotal.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  navRow: { flexDirection: 'row', gap: 8 },
  navBtn: { padding: 6, backgroundColor: '#f8fafc', borderRadius: 20 },

  weekRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  weekDay: { textAlign: 'center', paddingVertical: 8, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#f1f5f9', padding: 4, alignItems: 'center' },
  cellOutside: { backgroundColor: '#f8fafc' },
  cellToday: { backgroundColor: '#ecfdf5' },
  
  dateNum: { fontSize: 12, fontWeight: '500', color: '#0f172a', marginBottom: 4 },
  textOutside: { color: '#cbd5e1' },
  textToday: { color: '#059669', fontWeight: '700' },

  expensePill: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, width: '100%', alignItems: 'center' },
  pillNormal: { backgroundColor: '#f1f5f9' },
  pillHigh: { backgroundColor: '#fff1f2' },
  pillText: { fontSize: 9, fontWeight: '700' },
  pillTextNormal: { color: '#475569' },
  pillTextHigh: { color: '#be123c' },

  footer: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletIcon: { padding: 8, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  footerLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  footerSub: { fontSize: 11, color: '#94a3b8' },
  footerAmount: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
});